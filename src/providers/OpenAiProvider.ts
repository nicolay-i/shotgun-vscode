import OpenAI from 'openai';
import { IAiProvider } from './IAiProvider';
import { ApiConfig, AiResponse } from '../types';

/**
 * Провайдер для работы с OpenAI API
 */
export class OpenAiProvider implements IAiProvider {
    async sendRequest(systemPrompt: string, userPrompt: string, config: ApiConfig): Promise<AiResponse> {
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

            const content = response.choices[0]?.message?.content || 'Пустой ответ от OpenAI';
            
            // Извлекаем информацию о токенах из ответа OpenAI
            const usage = response.usage ? {
                prompt_tokens: response.usage.prompt_tokens || 0,
                completion_tokens: response.usage.completion_tokens || 0,
                total_tokens: response.usage.total_tokens || 0
            } : undefined;

            return {
                content,
                usage
            };
        } catch (error: any) {
            throw new Error(`Ошибка OpenAI API: ${error.message}`);
        }
    }
}