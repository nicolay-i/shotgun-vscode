import { ApiConfig, PromptTemplate, SelectedFile } from './types';

/**
 * Интерфейс для сервиса работы с AI API
 * Позволяет подменять реализацию для тестирования
 */
export interface IApiService {
    /**
     * Генерирует preview полной нагрузки запроса к LLM
     * @param prompt Пользовательский промпт
     * @param selectedFiles Выбранные файлы для анализа
     * @param config Конфигурация API
     * @param template Шаблон промпта (опционально)
     * @returns Объект с preview данными
     */
    generatePayloadPreview(
        prompt: string,
        selectedFiles: SelectedFile[],
        config: ApiConfig,
        template?: PromptTemplate
    ): { systemPrompt: string; userPrompt: string; payload: any };

    /**
     * Отправляет запрос к AI провайдеру
     * @param prompt Пользовательский промпт
     * @param selectedFiles Выбранные файлы для анализа
     * @param config Конфигурация API
     * @param template Шаблон промпта (опционально)
     * @returns Ответ от AI провайдера
     * @throws Error при ошибке запроса
     */
    sendRequest(
        prompt: string,
        selectedFiles: SelectedFile[],
        config: ApiConfig,
        template?: PromptTemplate
    ): Promise<string>;
} 