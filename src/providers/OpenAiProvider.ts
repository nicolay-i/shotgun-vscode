import OpenAI from 'openai';
import { IAiProvider, AIResponse, TokenUsage } from './IAiProvider';
import { ApiConfig } from '../types';

/**
 * Провайдер для работы с OpenAI API
 */
export class OpenAiProvider implements IAiProvider {
    async sendRequest(systemPrompt: string, userPrompt: string, config: ApiConfig): Promise<AIResponse> {
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

            const usage: TokenUsage = {
                prompt_tokens: response.usage?.prompt_tokens || 0,
                completion_tokens: response.usage?.completion_tokens || 0,
                total_tokens: response.usage?.total_tokens || 0
            };

            return {
                content: response.choices[0]?.message?.content || 'Пустой ответ от OpenAI',
                usage
            };
        } catch (error: any) {
            throw new Error(`Ошибка OpenAI API: ${error.message}`);
        }
    }
}