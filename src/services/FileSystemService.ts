import * as fs from 'fs';
import * as path from 'path';
import { IFileSystemService } from './IFileSystemService';
import { FileNode } from '../types';

/**
 * Реализация сервиса для работы с файловой системой
 */
export class FileSystemService implements IFileSystemService {
    async readFileContent(filePath: string): Promise<string> {
        try {
            return await fs.promises.readFile(filePath, 'utf-8');
        } catch (error: any) {
            throw new Error(`Ошибка чтения файла ${filePath}: ${error.message}`);
        }
    }

    async buildFileTree(rootPath: string, relativePath = ''): Promise<FileNode[]> {
        const items: FileNode[] = [];
        
        try {
            const entries = await fs.promises.readdir(rootPath, { withFileTypes: true });
            
            for (const entry of entries) {
                // Игнорируем системные и нерелевантные директории
                if (this.shouldIgnoreFile(entry.name)) {
                    continue;
                }

                const fullPath = path.join(rootPath, entry.name);
                const itemRelativePath = path.join(relativePath, entry.name);

                if (entry.isDirectory()) {
                    const children = await this.buildFileTree(fullPath, itemRelativePath);
                    items.push({
                        name: entry.name,
                        path: itemRelativePath,
                        type: 'directory',
                        children,
                        isExpanded: false
                    });
                } else if (entry.isFile() && this.isTextFile(entry.name)) {
                    items.push({
                        name: entry.name,
                        path: itemRelativePath,
                        type: 'file'
                    });
                }
            }
        } catch (error: any) {
            console.error(`Ошибка чтения директории ${rootPath}:`, error);
        }

        return items.sort((a, b) => {
            // Сначала папки, потом файлы
            if (a.type !== b.type) {
                return a.type === 'directory' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        });
    }

    async fileExists(filePath: string): Promise<boolean> {
        try {
            await fs.promises.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    async saveFile(filePath: string, content: string): Promise<void> {
        try {
            await fs.promises.writeFile(filePath, content, 'utf-8');
        } catch (error: any) {
            throw new Error(`Ошибка записи файла ${filePath}: ${error.message}`);
        }
    }

    async ensureDirectory(dirPath: string): Promise<void> {
        try {
            await fs.promises.mkdir(dirPath, { recursive: true });
        } catch (error: any) {
            throw new Error(`Ошибка создания директории ${dirPath}: ${error.message}`);
        }
    }

    /**
     * Проверяет, нужно ли игнорировать файл/директорию
     * @param name Имя файла/директории
     * @returns true если нужно игнорировать
     */
    private shouldIgnoreFile(name: string): boolean {
        const ignoredPatterns = [
            'node_modules',
            '.git',
            '.vscode',
            'dist',
            'build',
            'out',
            '.next',
            '.nuxt',
            'coverage',
            '.nyc_output',
            '.DS_Store',
            'Thumbs.db',
            '.env',
            '.env.local',
            '.env.production',
            '.env.development'
        ];

        return ignoredPatterns.includes(name);
    }

    /**
     * Проверяет, является ли файл текстовым
     * @param fileName Имя файла
     * @returns true если файл текстовый
     */
    private isTextFile(fileName: string): boolean {
        const textExtensions = [
            '.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte',
            '.html', '.css', '.scss', '.sass', '.less',
            '.json', '.xml', '.yaml', '.yml', '.toml',
            '.md', '.txt', '.py', '.java', '.c', '.cpp', '.h',
            '.cs', '.php', '.rb', '.go', '.rs', '.swift',
            '.kt', '.scala', '.dart', '.sh', '.bat', '.ps1',
            '.sql', '.graphql', '.prisma', '.proto'
        ];

        const extension = path.extname(fileName).toLowerCase();
        return textExtensions.includes(extension);
    }
} 