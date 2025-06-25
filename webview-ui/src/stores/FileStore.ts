import { makeAutoObservable, action, computed } from 'mobx';

export interface FileNode {
    name: string;
    path: string;
    type: 'file' | 'directory';
    children?: FileNode[];
    isSelected?: boolean;
    isExpanded?: boolean;
}

export interface SelectedFile {
    path: string;
    content?: string;
}

export class FileStore {
    fileTree: FileNode[] = [];
    selectedFiles: Map<string, SelectedFile> = new Map();
    expandedFolders: Set<string> = new Set();

    constructor() {
        makeAutoObservable(this, {
            setFileTree: action,
            selectFile: action,
            unselectFile: action,
            toggleFolder: action,
            clearSelection: action,
            selectedFilesList: computed
        });

        this.loadPersistedState();
    }

    setFileTree(tree: FileNode[]) {
        this.fileTree = tree;
        this.updateTreeWithSelection(this.fileTree);
    }

    get selectedFilesList(): SelectedFile[] {
        return Array.from(this.selectedFiles.values());
    }

    selectFile(file: FileNode) {
        if (file.type === 'file') {
            this.selectedFiles.set(file.path, { path: file.path });
        } else if (file.type === 'directory') {
            this.selectDirectory(file);
        }
        this.updateTreeWithSelection(this.fileTree);
        this.savePersistedState();
    }

    private selectDirectory(directory: FileNode) {
        if (directory.children) {
            directory.children.forEach(child => {
                if (child.type === 'file') {
                    this.selectedFiles.set(child.path, { path: child.path });
                } else {
                    this.selectDirectory(child);
                }
            });
        }
    }

    unselectFile(path: string) {
        // Если это файл, просто удаляем
        if (this.selectedFiles.has(path)) {
            this.selectedFiles.delete(path);
        } else {
            // Если это директория, удаляем все файлы из неё
            const filesToRemove: string[] = [];
            this.selectedFiles.forEach((_, filePath) => {
                if (filePath.startsWith(path + '/') || filePath.startsWith(path + '\\')) {
                    filesToRemove.push(filePath);
                }
            });
            filesToRemove.forEach(filePath => this.selectedFiles.delete(filePath));
        }
        
        this.updateTreeWithSelection(this.fileTree);
        this.savePersistedState();
    }

    toggleFolder(folderPath: string) {
        if (this.expandedFolders.has(folderPath)) {
            this.expandedFolders.delete(folderPath);
        } else {
            this.expandedFolders.add(folderPath);
        }
        this.updateTreeWithSelection(this.fileTree);
        this.savePersistedState();
    }

    clearSelection() {
        this.selectedFiles.clear();
        this.updateTreeWithSelection(this.fileTree);
        this.savePersistedState();
    }

    private updateTreeWithSelection(nodes: FileNode[]) {
        nodes.forEach(node => {
            if (node.type === 'file') {
                node.isSelected = this.selectedFiles.has(node.path);
            } else {
                node.isExpanded = this.expandedFolders.has(node.path);
                if (node.children) {
                    this.updateTreeWithSelection(node.children);
                    // Определяем состояние чекбокса папки
                    const childFiles = this.getAllFilesInDirectory(node);
                    const selectedChildFiles = childFiles.filter(file => this.selectedFiles.has(file.path));
                    
                    if (selectedChildFiles.length === 0) {
                        node.isSelected = false;
                    } else if (selectedChildFiles.length === childFiles.length) {
                        node.isSelected = true;
                    } else {
                        // Indeterminate state - можно добавить отдельное поле
                        node.isSelected = undefined;
                    }
                }
            }
        });
    }

    private getAllFilesInDirectory(directory: FileNode): FileNode[] {
        const files: FileNode[] = [];
        if (directory.children) {
            directory.children.forEach(child => {
                if (child.type === 'file') {
                    files.push(child);
                } else {
                    files.push(...this.getAllFilesInDirectory(child));
                }
            });
        }
        return files;
    }

    private savePersistedState() {
        const state = {
            selectedFiles: Array.from(this.selectedFiles.keys()),
            expandedFolders: Array.from(this.expandedFolders)
        };
        localStorage.setItem('fileStore', JSON.stringify(state));
    }

    private loadPersistedState() {
        try {
            const saved = localStorage.getItem('fileStore');
            if (saved) {
                const state = JSON.parse(saved);
                if (state.selectedFiles) {
                    state.selectedFiles.forEach((path: string) => {
                        this.selectedFiles.set(path, { path });
                    });
                }
                if (state.expandedFolders) {
                    this.expandedFolders = new Set(state.expandedFolders);
                }
            }
        } catch (error) {
            console.warn('Ошибка загрузки состояния FileStore:', error);
        }
    }
} 