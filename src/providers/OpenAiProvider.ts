import OpenAI from 'openai';
import { IAiProvider } from './IAiProvider';
import { ApiConfig } from '../types';

/**
 * Провайдер для работы с OpenAI API
 */
export class OpenAiProvider implements IAiProvider {
    async sendRequest(systemPrompt: string, userPrompt: string, config: ApiConfig): Promise<string> {
        try {
            const openai = new OpenAI({
                apiKey: config.apiKey,
            });

            const response = await openai.chat.completions.create({
                model: config.model || 'gpt-4',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7,
            });

            return response.choices[0]?.message?.content || 'Пустой ответ от OpenAI';
        } catch (error: any) {
            throw new Error(`Ошибка OpenAI API: ${error.message}`);
        }
    }
} 