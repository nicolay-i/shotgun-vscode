import React, { useState, useEffect, useCallback } from 'react';
import { Folder, FolderOpen, File, CaretRight, CaretDown } from 'phosphor-react';

declare const acquireVsCodeApi: () => any;

interface FileNode {
    name: string;
    path: string;
    type: 'file' | 'directory';
    children?: FileNode[];
}

interface FileTreeProps {
    fileTree: FileNode[];
    selectedFiles: Map<string, string>;
    onFileSelect: (filePath: string) => void;
    onFileOpen?: (filePath: string) => void;
    onCheckedFilesChange?: (checkedFiles: Set<string>) => void;
    forceRefresh?: number;
}

interface FileNodeComponentProps {
    node: FileNode;
    selectedFiles: Map<string, string>;
    checkedFiles: Set<string>;
    expandedFolders: Set<string>;
    onFileSelect: (filePath: string) => void;
    onFileOpen?: (filePath: string) => void;
    onCheck: (filePath: string, checked: boolean) => void;
    onToggleExpand: (folderPath: string) => void;
    depth?: number;
}

interface TreeState {
    checkedFiles: Set<string>;
    expandedFolders: Set<string>;
}

// Рекурсивная функция для получения всех путей в папке
const getAllPathsInFolder = (node: FileNode): string[] => {
    const paths = [node.path];
    if (node.children) {
        for (const child of node.children) {
            paths.push(...getAllPathsInFolder(child));
        }
    }
    return paths;
};

// Функция для проверки частичного выбора (indeterminate state)
const isPartiallySelected = (node: FileNode, checkedFiles: Set<string>): boolean => {
    if (node.type === 'file') return false;
    if (!node.children) return false;
    
    const allPaths = getAllPathsInFolder(node).filter(path => path !== node.path);
    const checkedPaths = allPaths.filter(path => checkedFiles.has(path));
    
    return checkedPaths.length > 0 && checkedPaths.length < allPaths.length;
};

const FileNodeComponent: React.FC<FileNodeComponentProps> = ({ 
    node, 
    selectedFiles,
    checkedFiles,
    expandedFolders,
    onFileSelect, 
    onFileOpen,
    onCheck,
    onToggleExpand,
    depth = 0 
}) => {
    const isSelected = selectedFiles.has(node.path);
    const isChecked = checkedFiles.has(node.path);
    const isExpanded = expandedFolders.has(node.path);
    const isPartial = isPartiallySelected(node, checkedFiles);
    
    const FolderIcon = isExpanded ? FolderOpen : Folder;
    const CaretIcon = isExpanded ? CaretDown : CaretRight;

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        onCheck(node.path, e.target.checked);
    };

    const handleFolderClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (node.type === 'directory') {
            onToggleExpand(node.path);
        }
    };

    const handleFileClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (node.type === 'file') {
            if (onFileOpen) {
                onFileOpen(node.path);
            } else {
                onFileSelect(node.path);
            }
        }
    };

    return (
        <div>
            <div 
                className={`file-node ${isSelected ? 'selected' : ''}`}
                style={{ paddingLeft: `${depth * 20 + 8}px` }}
            >
                <div className="file-item">
                    <input
                        type="checkbox"
                        checked={isChecked}
                        ref={(input) => {
                            if (input) {
                                input.indeterminate = isPartial;
                            }
                        }}
                        onChange={handleCheckboxChange}
                        className="file-checkbox"
                    />
                    
                    {node.type === 'directory' && node.children && (
                        <button 
                            className="expand-btn"
                            onClick={handleFolderClick}
                        >
                            <CaretIcon size={12} />
                        </button>
                    )}
                    
                    <div 
                        className="file-name-container"
                        onClick={node.type === 'directory' ? handleFolderClick : handleFileClick}
                    >
                        {node.type === 'directory' ? (
                            <FolderIcon size={16} />
                        ) : (
                            <File size={16} />
                        )}
                        <span className="file-name">{node.name}</span>
                    </div>
                </div>
            </div>
            
            {node.type === 'directory' && node.children && isExpanded && 
                node.children.map((child, index) => (
                    <FileNodeComponent
                        key={index}
                        node={child}
                        selectedFiles={selectedFiles}
                        checkedFiles={checkedFiles}
                        expandedFolders={expandedFolders}
                        onFileSelect={onFileSelect}
                        onFileOpen={onFileOpen}
                        onCheck={onCheck}
                        onToggleExpand={onToggleExpand}
                        depth={depth + 1}
                    />
                ))
            }
        </div>
    );
};

const FileTree: React.FC<FileTreeProps> = ({ 
    fileTree, 
    selectedFiles, 
    onFileSelect,
    onFileOpen,
    onCheckedFilesChange,
    forceRefresh
}) => {
    const [treeState, setTreeState] = useState<TreeState>(() => {
        // Загружаем состояние из localStorage
        const saved = localStorage.getItem('fileTree_state');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return {
                    checkedFiles: new Set(parsed.checkedFiles || []),
                    expandedFolders: new Set(parsed.expandedFolders || [])
                };
            } catch (e) {
                console.error('Ошибка при загрузке состояния файлового дерева:', e);
            }
        }
        return {
            checkedFiles: new Set<string>(),
            expandedFolders: new Set<string>()
        };
    });

    // Функция для получения родительских папок
    const getParentFolders = (filePath: string): string[] => {
        const parts = filePath.split(/[/\\]/);
        const parents: string[] = [];
        
        for (let i = parts.length - 2; i >= 0; i--) {
            const parentPath = parts.slice(0, i + 1).join('/');
            if (parentPath) {
                parents.push(parentPath);
            }
        }
        
        return parents;
    };

    // Функция для проверки должна ли папка быть выбрана
    const shouldFolderBeChecked = useCallback((folderPath: string, checkedFiles: Set<string>): boolean => {
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

        const folderNode = findNode(fileTree, folderPath);
        if (!folderNode || folderNode.type !== 'directory') return false;

        // Получаем все пути в этой папке (исключая саму папку)
        const allPathsInFolder = getAllPathsInFolder(folderNode);
        const childPaths = allPathsInFolder.filter(path => path !== folderPath);
        
        // Папка должна быть выбрана если выбраны ВСЕ её дочерние элементы
        return childPaths.length > 0 && childPaths.every(path => checkedFiles.has(path));
    }, [fileTree]);

    // Функция для обновления состояния папок
    const updateFoldersState = useCallback((newCheckedFiles: Set<string>) => {
        // Проходим по всему дереву и обновляем состояние папок
        const updateNode = (node: FileNode) => {
            if (node.type === 'directory') {
                if (shouldFolderBeChecked(node.path, newCheckedFiles)) {
                    newCheckedFiles.add(node.path);
                } else {
                    newCheckedFiles.delete(node.path);
                }
            }
            
            if (node.children) {
                node.children.forEach(updateNode);
            }
        };

        fileTree.forEach(updateNode);
    }, [fileTree, shouldFolderBeChecked]);

    // Принудительная перезагрузка состояния при внешних изменениях
    useEffect(() => {
        if (forceRefresh !== undefined && forceRefresh > 0) {
            const saved = localStorage.getItem('fileTree_state');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    const newCheckedFiles = new Set<string>((parsed.checkedFiles || []) as string[]);
                    
                    // Обновляем состояние папок на основе новых данных
                    updateFoldersState(newCheckedFiles);
                    
                    setTreeState({
                        checkedFiles: newCheckedFiles,
                        expandedFolders: new Set<string>((parsed.expandedFolders || []) as string[])
                    });
                } catch (e) {
                    console.error('Ошибка при принудительной перезагрузке состояния файлового дерева:', e);
                }
            }
        }
    }, [forceRefresh, updateFoldersState]);

    // Сохраняем состояние в localStorage при изменении
    useEffect(() => {
        const stateToSave = {
            checkedFiles: Array.from(treeState.checkedFiles),
            expandedFolders: Array.from(treeState.expandedFolders)
        };
        localStorage.setItem('fileTree_state', JSON.stringify(stateToSave));
        
        // Уведомляем родительский компонент о изменении выбранных файлов
        if (onCheckedFilesChange) {
            onCheckedFilesChange(treeState.checkedFiles);
        }
    }, [treeState, onCheckedFilesChange]);

    const handleCheck = (filePath: string, checked: boolean) => {
        setTreeState(prevState => {
            const newCheckedFiles = new Set(prevState.checkedFiles);
            
            // Находим узел в дереве
            const findNode = (nodes: FileNode[], path: string): FileNode | null => {
                for (const node of nodes) {
                    if (node.path === path) return node;
                    if (node.children) {
                        const found = findNode(node.children, path);
                        if (found) return found;
                    }
                }
                return null;
            };
            
            const node = findNode(fileTree, filePath);
            if (!node) return prevState;
            
            if (checked) {
                if (node.type === 'directory') {
                    // Для папки - выбираем все дочерние элементы
                    const allPaths = getAllPathsInFolder(node);
                    allPaths.forEach(path => newCheckedFiles.add(path));
                } else {
                    // Для файла - просто добавляем его
                    newCheckedFiles.add(filePath);
                }
            } else {
                if (node.type === 'directory') {
                    // Для папки - снимаем выбор со всех дочерних элементов
                    const allPaths = getAllPathsInFolder(node);
                    allPaths.forEach(path => newCheckedFiles.delete(path));
                } else {
                    // Для файла - просто убираем его
                    newCheckedFiles.delete(filePath);
                }
            }
            
            // Обновляем состояние всех папок
            updateFoldersState(newCheckedFiles);
            
            return {
                ...prevState,
                checkedFiles: newCheckedFiles
            };
        });
    };

    const handleToggleExpand = (folderPath: string) => {
        setTreeState(prevState => {
            const newExpandedFolders = new Set(prevState.expandedFolders);
            if (newExpandedFolders.has(folderPath)) {
                newExpandedFolders.delete(folderPath);
            } else {
                newExpandedFolders.add(folderPath);
            }
            return {
                ...prevState,
                expandedFolders: newExpandedFolders
            };
        });
    };



    const handleFileOpen = (filePath: string) => {
        // Отправляем сообщение в расширение для открытия файла
        try {
            const vscode = acquireVsCodeApi();
            vscode.postMessage({
                type: 'openFile',
                filePath: filePath
            });
        } catch (e) {
            console.warn('VSCode API недоступен');
        }
        
        // Также вызываем onFileOpen если он передан
        if (onFileOpen) {
            onFileOpen(filePath);
        }
    };

    return (
        <div className="file-tree">
            {fileTree.map((node, index) => (
                <FileNodeComponent
                    key={index}
                    node={node}
                    selectedFiles={selectedFiles}
                    checkedFiles={treeState.checkedFiles}
                    expandedFolders={treeState.expandedFolders}
                    onFileSelect={onFileSelect}
                    onFileOpen={handleFileOpen}
                    onCheck={handleCheck}
                    onToggleExpand={handleToggleExpand}
                />
            ))}
        </div>
    );
};

export default FileTree; 