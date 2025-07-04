import { ApiConfig, PromptTemplate, SelectedFile } from './types';
import { ProviderFactory } from './providers/ProviderFactory';

/**
 * Сервис для работы с AI API
 * Использует паттерн "Стратегия" для работы с различными провайдерами
 */
export class ApiService {
    
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
    ): { systemPrompt: string; userPrompt: string; payload: any } {
        const { systemPrompt, userPrompt } = this.formatPrompt(template, prompt, selectedFiles);
        
        let payload: any = {};
        
        switch (config.provider) {
            case 'openai':
            case 'openrouter':
                payload = {
                    model: config.model || 'gpt-4',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.7
                };
                break;
            case 'gemini':
                payload = {
                    model: config.model || 'gemini-1.5-pro',
                    contents: [{
                        parts: [{
                            text: `${systemPrompt}\n\nЗадача пользователя:\n${userPrompt}`
                        }]
                    }]
                };
                break;
            case 'custom':
                payload = {
                    model: config.model || 'custom-model',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.7
                };
                break;
            default:
                payload = {
                    model: config.model || 'unknown-model',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ]
                };
        }
        
        return { systemPrompt, userPrompt, payload };
    }
    /**
     * Форматирует промпт на основе шаблона и выбранных файлов
     * @param template Шаблон промпта (опционально)
     * @param userPrompt Пользовательский промпт
     * @param selectedFiles Выбранные файлы
     * @returns Отформатированные системный и пользовательский промпты
     */
    private formatPrompt(
        template: PromptTemplate | undefined,
        userPrompt: string,
        selectedFiles: SelectedFile[]
    ): { systemPrompt: string; userPrompt: string } {
        const filesContent = selectedFiles
            .map(file => `\n--- ${file.path} ---\n${file.content}`)
            .join('\n');

        if (template) {
            const formattedUserPrompt = template.userPrompt
                .replace('{{ЗАДАЧА}}', userPrompt)
                .replace('{{FILES}}', filesContent);

            return {
                systemPrompt: template.systemPrompt,
                userPrompt: formattedUserPrompt
            };
        }

        return {
            systemPrompt: 'Ты — опытный разработчик программного обеспечения. Анализируй код, предлагай улучшения и отвечай на вопросы по коду.',
            userPrompt: `${userPrompt}\n\nФайлы для анализа:${filesContent}`
        };
    }

    /**
     * Отправляет запрос к AI провайдеру
     * @param prompt Пользовательский промпт
     * @param selectedFiles Выбранные файлы для анализа
     * @param config Конфигурация API
     * @param template Шаблон промпта (опционально)
     * @returns Ответ от AI провайдера
     * @throws Error при ошибке запроса
     */
    async sendRequest(
        prompt: string,
        selectedFiles: SelectedFile[],
        config: ApiConfig,
        template?: PromptTemplate
    ): Promise<string> {
        const { systemPrompt, userPrompt } = this.formatPrompt(template, prompt, selectedFiles);
        
        // Получаем провайдер через фабрику
        const provider = ProviderFactory.getProvider(config.provider);
        
        return provider.sendRequest(systemPrompt, userPrompt, config);
    }
} 