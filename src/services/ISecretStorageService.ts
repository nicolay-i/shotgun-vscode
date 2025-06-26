/**
 * Интерфейс для безопасного хранения секретов
 * Абстракция над VS Code SecretStorage API
 */
export interface ISecretStorageService {
    /**
     * Сохраняет секрет
     * @param key Ключ для сохранения
     * @param value Значение секрета
     */
    store(key: string, value: string): Promise<void>;

    /**
     * Получает секрет
     * @param key Ключ секрета
     * @returns Значение секрета или undefined если не найден
     */
    get(key: string): Promise<string | undefined>;

    /**
     * Удаляет секрет
     * @param key Ключ секрета
     */
    delete(key: string): Promise<void>;

    /**
     * Проверяет, существует ли секрет
     * @param key Ключ секрета
     * @returns true если секрет существует
     */
    exists(key: string): Promise<boolean>;
} 