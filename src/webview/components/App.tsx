import React, { useState, useEffect, useCallback } from 'react';
import { VSCodeAPI } from '../types/vscode';
import FileTree from './FileTree';
import PromptSection from './PromptSection';
import SelectedFiles from './SelectedFiles';
import ResponseSection from './ResponseSection';
import LoadingOverlay from './LoadingOverlay';

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
                case 'geminiResponse':
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

    const handleSubmit = () => {
        if (!prompt.trim() || selectedFiles.size === 0) return;
        
        const filesArray: SelectedFile[] = Array.from(selectedFiles.entries()).map(([path, content]) => ({
            path,
            content
        }));
        
        vscode.postMessage({
            type: 'submitToGemini',
            prompt: prompt,
            selectedFiles: filesArray
        });
    };

    const handleClear = () => {
        setSelectedFiles(new Map());
        setCheckedFiles(new Set());
        setPrompt('');
        setResponse('');
        
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
        </div>
    );
};

export default App; 