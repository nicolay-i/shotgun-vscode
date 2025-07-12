import fetch from 'node-fetch';
import { IAiProvider } from './IAiProvider';
import { ApiConfig } from '../types';

/**
 * Провайдер для работы с кастомными API
 */
export class CustomProvider implements IAiProvider {
    async sendRequest(systemPrompt: string, userPrompt: string, config: ApiConfig): Promise<string> {
        try {
            if (!config.customUrl) {
                throw new Error('Не указан URL для кастомного API');
            }

            // Валидация URL для предотвращения SSRF-атак
            this.validateUrl(config.customUrl);

            const response = await fetch(`${config.customUrl}/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: config.model || 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.7,
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json() as any;
            return data.choices[0]?.message?.content || 'Пустой ответ от кастомного API';
        } catch (error: any) {
            throw new Error(`Ошибка кастомного API: ${error.message}`);
        }
    }

    /**
     * Валидация URL для предотвращения SSRF-атак
     * @param url URL для валидации
     * @throws Error если URL невалидный
     */
    private validateUrl(url: string): void {
        try {
            const parsedUrl = new URL(url);
            
            // Разрешаем только HTTP и HTTPS
            if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
                throw new Error('Поддерживаются только HTTP и HTTPS протоколы');
            }
        } catch (error) {
            throw new Error(`Невалидный URL: ${error instanceof Error ? error.message : 'неизвестная ошибка'}`);
        }
    }

    generatePayload(systemPrompt: string, userPrompt: string, config: ApiConfig): object {
        return {
            model: config.model || 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
        };
    }
} 