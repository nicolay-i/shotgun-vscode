import React, { useState, useEffect, useCallback } from 'react';
import { VSCodeAPI } from '../types/vscode';
import FileTree from './FileTree';
import PromptSection from './PromptSection';
import SelectedFiles from './SelectedFiles';
import ResponseSection from './ResponseSection';
import LoadingOverlay from './LoadingOverlay';
import ApiSettings from './ApiSettings';
import TemplateManager from './TemplateManager';
import TemplateEditor from './TemplateEditor';
import PromptPreview from './PromptPreview';
import { PromptTemplate } from '../../types/ApiTypes';

// Получаем API VSCode
declare const acquireVsCodeApi: () => VSCodeAPI;
const vscode = acquireVsCodeApi();

interface FileNode {
    name: string;
    path: string;
    type: 'file' | 'directory';
    children?: FileNode[];
}

interface SelectedFile {
    path: string;
    content: string;
}

const App: React.FC = () => {
    const [fileTree, setFileTree] = useState<FileNode[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<Map<string, string>>(new Map());
    const [checkedFiles, setCheckedFiles] = useState<Set<string>>(new Set());
    const [forceTreeRefresh, setForceTreeRefresh] = useState<number>(0);
    const [prompt, setPrompt] = useState<string>(() => {
        // Загружаем сохраненный промпт из localStorage
        return localStorage.getItem('shotgun_prompt') || '';
    });
    const [response, setResponse] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [apiSettingsExpanded, setApiSettingsExpanded] = useState<boolean>(false);
    
    // Состояние для шаблонов
    const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
    const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
    const [isTemplateEditorOpen, setIsTemplateEditorOpen] = useState<boolean>(false);
    const [previewTemplate, setPreviewTemplate] = useState<PromptTemplate | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

    useEffect(() => {
        // Запросить дерево файлов при загрузке
        vscode.postMessage({ type: 'getFiles' });

        // Обработчик сообщений от расширения
        const messageHandler = (event: MessageEvent) => {
            const message = event.data;
            
            switch (message.type) {
                case 'fileTree':
                    setFileTree(message.data);
                    break;
                case 'fileContent':
                    setSelectedFiles(prev => {
                        const newMap = new Map(prev);
                        newMap.set(message.data.path, message.data.content);
                        return newMap;
                    });
                    break;
                case 'aiResponse':
                    setResponse(message.data);
                    setIsLoading(false);
                    break;
                case 'loadingStart':
                    setIsLoading(true);
                    break;
                case 'loadingEnd':
                    setIsLoading(false);
                    break;
            }
        };

        window.addEventListener('message', messageHandler);
        return () => window.removeEventListener('message', messageHandler);
    }, []);

    // Сохраняем промпт в localStorage при изменении
    useEffect(() => {
        localStorage.setItem('shotgun_prompt', prompt);
    }, [prompt]);

    // Синхронизируем selectedFiles с checkedFiles
    useEffect(() => {
        // Получаем содержимое только файлов (не папок)
        const filesToLoad = Array.from(checkedFiles).filter(path => {
            const findNode = (nodes: FileNode[], searchPath: string): FileNode | null => {
                for (const node of nodes) {
                    if (node.path === searchPath) return node;
                    if (node.children) {
                        const found = findNode(node.children, searchPath);
                        if (found) return found;
                    }
                }
                return null;
            };
            
            const node = findNode(fileTree, path);
            return node && node.type === 'file';
        });

        // Загружаем содержимое новых файлов
        filesToLoad.forEach(filePath => {
            if (!selectedFiles.has(filePath)) {
                vscode.postMessage({ 
                    type: 'getFileContent', 
                    filePath: filePath 
                });
            }
        });

        // Удаляем файлы, которые больше не выбраны
        const newSelectedFiles = new Map(selectedFiles);
        Array.from(selectedFiles.keys()).forEach(filePath => {
            if (!checkedFiles.has(filePath)) {
                newSelectedFiles.delete(filePath);
            }
        });

        if (newSelectedFiles.size !== selectedFiles.size) {
            setSelectedFiles(newSelectedFiles);
        }
    }, [checkedFiles, fileTree, selectedFiles]);

    const handleFileSelect = (filePath: string) => {
        if (selectedFiles.has(filePath)) {
            const newMap = new Map(selectedFiles);
            newMap.delete(filePath);
            setSelectedFiles(newMap);
        } else {
            vscode.postMessage({ 
                type: 'getFileContent', 
                filePath: filePath 
            });
        }
    };

    const handleCheckedFilesChange = (newCheckedFiles: Set<string>) => {
        setCheckedFiles(newCheckedFiles);
    };



    const handleFileRemove = (filePath: string) => {
        // Убираем файл из selectedFiles
        const newMap = new Map(selectedFiles);
        newMap.delete(filePath);
        setSelectedFiles(newMap);
        
        // Убираем файл из checkedFiles
        const newCheckedFiles = new Set(checkedFiles);
        newCheckedFiles.delete(filePath);
        setCheckedFiles(newCheckedFiles);
        
        // Обновляем состояние в FileTree через localStorage
        // FileTree сам обновит состояние папок при принудительном обновлении
        const savedTreeState = localStorage.getItem('fileTree_state');
        if (savedTreeState) {
            try {
                const parsed = JSON.parse(savedTreeState);
                const updatedCheckedFiles = (parsed.checkedFiles || []).filter((path: string) => path !== filePath);
                const updatedState = {
                    ...parsed,
                    checkedFiles: updatedCheckedFiles
                };
                localStorage.setItem('fileTree_state', JSON.stringify(updatedState));
                
                // Инициируем принудительное обновление FileTree
                setForceTreeRefresh(prev => prev + 1);
            } catch (e) {
                console.error('Ошибка при обновлении состояния файлового дерева:', e);
            }
        }
    };

    // Обработчики для шаблонов
    const handleTemplateSelect = (template: PromptTemplate | null) => {
        setSelectedTemplate(template);
    };

    const handleTemplateEdit = (template: PromptTemplate | null) => {
        setEditingTemplate(template);
        setIsTemplateEditorOpen(true);
    };

    const handleTemplateSave = (template: PromptTemplate) => {
        // Сохраняем шаблон в localStorage
        const savedTemplates = localStorage.getItem('shotgun_templates');
        let templates = savedTemplates ? JSON.parse(savedTemplates) : [];
        
        const existingIndex = templates.findIndex((t: PromptTemplate) => t.id === template.id);
        if (existingIndex >= 0) {
            templates[existingIndex] = template;
        } else {
            templates.push(template);
        }
        
        localStorage.setItem('shotgun_templates', JSON.stringify(templates));
        setIsTemplateEditorOpen(false);
        setEditingTemplate(null);
    };

    const handleTemplatePreview = (template: PromptTemplate) => {
        setPreviewTemplate(template);
        setIsPreviewOpen(true);
    };

    const handleUseTemplate = () => {
        if (previewTemplate && prompt.trim() && selectedFiles.size > 0) {
            handleSubmitWithTemplate(previewTemplate);
        }
        setIsPreviewOpen(false);
    };

    const handleSubmitWithTemplate = (template: PromptTemplate) => {
        if (!prompt.trim() || selectedFiles.size === 0) return;
        
        const filesArray: SelectedFile[] = Array.from(selectedFiles.entries()).map(([path, content]) => ({
            path,
            content
        }));
        
        // Формируем итоговый промпт из шаблона
        const filesContent = filesArray
            .map(file => `\n\n--- ${file.path} ---\n${file.content}`)
            .join('\n');

        const processedUserPrompt = template.userPrompt
            .replace(/\{\{ЗАДАЧА\}\}/g, prompt)
            .replace(/\{\{FILES\}\}/g, filesContent);

        const finalPrompt = `${template.systemPrompt}\n\n---\n\n${processedUserPrompt}`;
        
        // Получаем настройки API из localStorage
        const apiConfig = localStorage.getItem('shotgun_api_config');
        const config = apiConfig ? JSON.parse(apiConfig) : { provider: 'gemini' };
        
        vscode.postMessage({
            type: 'submitToAI',
            prompt: finalPrompt,
            selectedFiles: filesArray,
            apiConfig: config
        });
    };

    const handleSubmit = () => {
        if (!prompt.trim() || selectedFiles.size === 0) return;
        
        if (selectedTemplate) {
            handleSubmitWithTemplate(selectedTemplate);
        } else {
            const filesArray: SelectedFile[] = Array.from(selectedFiles.entries()).map(([path, content]) => ({
                path,
                content
            }));
            
            // Получаем настройки API из localStorage
            const apiConfig = localStorage.getItem('shotgun_api_config');
            const config = apiConfig ? JSON.parse(apiConfig) : { provider: 'gemini' };
            
            vscode.postMessage({
                type: 'submitToAI',
                prompt: prompt,
                selectedFiles: filesArray,
                apiConfig: config
            });
        }
    };

    const handleClear = () => {
        setSelectedFiles(new Map());
        setCheckedFiles(new Set());
        setPrompt('');
        setResponse('');
        setSelectedTemplate(null);
        
        // Очищаем состояние файлового дерева
        const emptyState = {
            checkedFiles: [],
            expandedFolders: JSON.parse(localStorage.getItem('fileTree_state') || '{}').expandedFolders || []
        };
        localStorage.setItem('fileTree_state', JSON.stringify(emptyState));
        localStorage.setItem('shotgun_prompt', '');
        
        // Инициируем принудительное обновление FileTree
        setForceTreeRefresh(prev => prev + 1);
    };

    const handleSave = () => {
        if (response) {
            vscode.postMessage({
                type: 'saveResponse',
                content: response
            });
        }
    };

    return (
        <div className="container">
            <div className="left-panel">
                <div className="panel-header">
                    <h3>📁 Файлы проекта</h3>
                </div>
                <FileTree 
                    fileTree={fileTree}
                    selectedFiles={selectedFiles}
                    onFileSelect={handleFileSelect}
                    onCheckedFilesChange={handleCheckedFilesChange}
                    forceRefresh={forceTreeRefresh}
                />
            </div>
            
            <div className="right-panel">
                <div className="panel-header">
                    <h3>🤖 AI Ассистент</h3>
                </div>
                
                <ApiSettings 
                    isExpanded={apiSettingsExpanded}
                    onToggle={() => setApiSettingsExpanded(!apiSettingsExpanded)}
                />
                
                <TemplateManager
                    selectedTemplate={selectedTemplate}
                    onTemplateSelect={handleTemplateSelect}
                    onTemplateEdit={handleTemplateEdit}
                    onTemplatePreview={handleTemplatePreview}
                />
                
                <PromptSection 
                    prompt={prompt}
                    onPromptChange={setPrompt}
                />
                
                <SelectedFiles 
                    selectedFiles={selectedFiles}
                    onFileRemove={handleFileRemove}
                />
                
                <div className="action-buttons">
                    <button 
                        onClick={handleSubmit}
                        disabled={selectedFiles.size === 0 || !prompt.trim()}
                        className="submit-btn"
                    >
                        ✈️ Отправить
                    </button>
                    <button 
                        onClick={handleClear}
                        className="clear-btn"
                    >
                        🗑️ Очистить
                    </button>
                </div>
                
                <ResponseSection 
                    response={response}
                    onSave={handleSave}
                />
            </div>
            
            {isLoading && <LoadingOverlay />}
            
            <TemplateEditor
                template={editingTemplate}
                isOpen={isTemplateEditorOpen}
                onClose={() => {
                    setIsTemplateEditorOpen(false);
                    setEditingTemplate(null);
                }}
                onSave={handleTemplateSave}
            />
            
            <PromptPreview
                template={previewTemplate}
                userInput={prompt}
                filesContent={Array.from(selectedFiles.entries())
                    .map(([path, content]) => `\n\n--- ${path} ---\n${content}`)
                    .join('\n')}
                isOpen={isPreviewOpen}
                onClose={() => {
                    setIsPreviewOpen(false);
                    setPreviewTemplate(null);
                }}
                onUseTemplate={handleUseTemplate}
            />
        </div>
    );
};

export default App; 