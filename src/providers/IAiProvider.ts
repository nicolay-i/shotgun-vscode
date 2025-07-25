import { ApiConfig } from '../types';

export interface TokenUsage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}

export interface AIResponse {
    content: string;
    usage: TokenUsage;
}

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
     * @returns Ответ от AI-провайдера с информацией о токенах
     * @throws Error при ошибке запроса
     */
    sendRequest(systemPrompt: string, userPrompt: string, config: ApiConfig): Promise<AIResponse>;
}