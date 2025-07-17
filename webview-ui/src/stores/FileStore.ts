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
    private currentWorkspace: string | null = null;

    constructor() {
        makeAutoObservable(this, {
            setFileTree: action,
            selectFile: action,
            unselectFile: action,
            toggleFolder: action,
            clearSelection: action,
            updateFileContent: action,
            setWorkspace: action,
            selectedFilesList: computed
        });
    }

    setWorkspace(workspacePath: string) {
        if (this.currentWorkspace !== workspacePath) {
            this.currentWorkspace = workspacePath;
            this.selectedFiles.clear();
            this.expandedFolders.clear();
            this.loadPersistedState();
        }
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

    updateFileContent(filePath: string, content: string) {
        const file = this.selectedFiles.get(filePath);
        if (file) {
            file.content = content;
        }
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
        if (!this.currentWorkspace) return;
        
        const state = {
            selectedFiles: Array.from(this.selectedFiles.keys()),
            expandedFolders: Array.from(this.expandedFolders)
        };
        const storageKey = `fileStore_${this.getWorkspaceHash(this.currentWorkspace)}`;
        localStorage.setItem(storageKey, JSON.stringify(state));
    }

    private loadPersistedState() {
        if (!this.currentWorkspace) return;
        
        try {
            const storageKey = `fileStore_${this.getWorkspaceHash(this.currentWorkspace)}`;
            const saved = localStorage.getItem(storageKey);
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

    private getWorkspaceHash(workspacePath: string): string {
        // Создаем простой хеш из пути к workspace
        let hash = 0;
        for (let i = 0; i < workspacePath.length; i++) {
            const char = workspacePath.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Конвертируем в 32-битное число
        }
        return Math.abs(hash).toString(36);
    }
} 