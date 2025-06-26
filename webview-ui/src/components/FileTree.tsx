import React from 'react';
import { observer } from 'mobx-react-lite';
import { useFileStore } from '../contexts/StoreContext';
import { 
    CaretRight, 
    CaretDown, 
    Folder, 
    FolderOpen, 
    File 
} from 'phosphor-react';
import { FileNode } from '../stores/FileStore';

interface FileNodeViewProps {
    node: FileNode;
    depth: number;
    onFileOpen: (filePath: string) => void;
}

const FileNodeView: React.FC<FileNodeViewProps> = observer(({ node, depth, onFileOpen }) => {
    const fileStore = useFileStore();
    
    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        if (e.target.checked) {
            fileStore.selectFile(node);
        } else {
            fileStore.unselectFile(node.path);
        }
    };

    const handleExpandToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (node.type === 'directory') {
            fileStore.toggleFolder(node.path);
        }
    };

    const handleNameClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (node.type === 'file') {
            onFileOpen(node.path);
        } else {
            fileStore.toggleFolder(node.path);
        }
    };

    const isIndeterminate = node.type === 'directory' && node.isSelected === undefined;
    const isChecked = node.isSelected === true;
    const isExpanded = node.type === 'directory' && node.isExpanded === true;

    return (
        <div className="file-node">
            <div 
                className="file-node__content"
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
            >
                <div className="file-node__row">
                    <input
                        type="checkbox"
                        className="file-node__checkbox"
                        checked={isChecked}
                        ref={(input) => {
                            if (input) {
                                input.indeterminate = isIndeterminate;
                            }
                        }}
                        onChange={handleCheckboxChange}
                    />
                    
                    {node.type === 'directory' && (
                        <button
                            className="file-node__caret"
                            onClick={handleExpandToggle}
                            aria-label={isExpanded ? 'Свернуть папку' : 'Развернуть папку'}
                        >
                            {isExpanded ? <CaretDown size={16} /> : <CaretRight size={16} />}
                        </button>
                    )}
                    
                    <div className="file-node__icon">
                        {node.type === 'directory' ? (
                            isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />
                        ) : (
                            <File size={16} />
                        )}
                    </div>
                    
                    <button
                        className="file-node__name"
                        onClick={handleNameClick}
                        title={node.path}
                    >
                        {node.name}
                    </button>
                </div>
            </div>
            
            {node.type === 'directory' && isExpanded && node.children && (
                <div className="file-node__children">
                    {node.children.map((child, index) => (
                        <FileNodeView
                            key={`${child.path}-${index}`}
                            node={child}
                            depth={depth + 1}
                            onFileOpen={onFileOpen}
                        />
                    ))}
                </div>
            )}
        </div>
    );
});

export interface FileTreeProps {
    onFileOpen: (filePath: string) => void;
}

export const FileTree: React.FC<FileTreeProps> = observer(({ onFileOpen }) => {
    const fileStore = useFileStore();

    if (fileStore.fileTree.length === 0) {
        return (
            <div className="file-tree">
                <div className="file-tree__empty">
                    <p className="text-small">Загрузка файлов...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="file-tree">
            <div className="file-tree__header">
                <span className="text-small">
                    Файлы проекта ({fileStore.selectedFilesList.length} выбрано)
                </span>
                {fileStore.selectedFilesList.length > 0 && (
                    <button
                        className="file-tree__clear"
                        onClick={() => fileStore.clearSelection()}
                        title="Очистить выбор"
                    >
                        Очистить
                    </button>
                )}
            </div>
            <div className="file-tree__content">
                {fileStore.fileTree.map((node, index) => (
                    <FileNodeView
                        key={`${node.path}-${index}`}
                        node={node}
                        depth={0}
                        onFileOpen={onFileOpen}
                    />
                ))}
            </div>
        </div>
    );
}); 