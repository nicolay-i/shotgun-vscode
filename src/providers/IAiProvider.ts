import { ApiConfig, UsageData } from '../types';

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
     * @returns Объект с ответом от AI-провайдера и данными об использовании токенов
     * @throws Error при ошибке запроса
     */
    sendRequest(systemPrompt: string, userPrompt: string, config: ApiConfig): Promise<{ response: string; usage: UsageData }>;
}