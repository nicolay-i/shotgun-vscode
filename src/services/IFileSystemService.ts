import { FileNode } from '../types';

/**
 * Интерфейс для работы с файловой системой
 * Абстракция для упрощения тестирования и переносимости
 */
export interface IFileSystemService {
    /**
     * Получает содержимое файла
     * @param filePath Путь к файлу
     * @returns Содержимое файла
     * @throws Error при ошибке чтения файла
     */
    readFileContent(filePath: string): Promise<string>;

    /**
     * Строит дерево файлов проекта
     * @param rootPath Корневой путь
     * @returns Дерево файлов
     * @throws Error при ошибке чтения директории
     */
    buildFileTree(rootPath: string): Promise<FileNode[]>;

    /**
     * Проверяет, существует ли файл
     * @param filePath Путь к файлу
     * @returns true если файл существует
     */
    fileExists(filePath: string): Promise<boolean>;

    /**
     * Сохраняет содержимое в файл
     * @param filePath Путь к файлу
     * @param content Содержимое для сохранения
     * @throws Error при ошибке записи файла
     */
    saveFile(filePath: string, content: string): Promise<void>;

    /**
     * Создает директорию если она не существует
     * @param dirPath Путь к директории
     * @throws Error при ошибке создания директории
     */
    ensureDirectory(dirPath: string): Promise<void>;
} 