import { ApiConfig } from '../types';

/**
 * Интерфейс для провайдеров AI-сервисов
 * Реализует паттерн "Стратегия" для упрощения добавления новых провайдеров
 */
export interface IAiProvider {
    /**
     * Отправляет запрос к AI-провайдеру
     * @param systemPrompt Системный промпт для AI
     * @param userPrompt Пользовательский промпт
     * @param config Конфигурация API
     * @returns Ответ от AI-провайдера
     * @throws Error при ошибке запроса
     */
    sendRequest(systemPrompt: string, userPrompt: string, config: ApiConfig): Promise<string>;

    /**
     * Генерирует payload для запроса к AI-провайдеру
     * @param systemPrompt Системный промпт для AI
     * @param userPrompt Пользовательский промпт
     * @param config Конфигурация API
     * @returns Объект payload для запроса
     */
    generatePayload(systemPrompt: string, userPrompt: string, config: ApiConfig): object;
} 