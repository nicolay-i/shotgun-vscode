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
} 