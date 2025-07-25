import fetch from 'node-fetch';
import { IAiProvider, AIResponse, TokenUsage } from './IAiProvider';
import { ApiConfig } from '../types';

/**
 * Провайдер для работы с OpenRouter API
 */
export class OpenRouterProvider implements IAiProvider {
    async sendRequest(systemPrompt: string, userPrompt: string, config: ApiConfig): Promise<AIResponse> {
        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://vscode-ai-assistant.com',
                    'X-Title': 'AI Code Assistant'
                },
                body: JSON.stringify({
                    model: config.model || 'anthropic/claude-3-sonnet',
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
            
            // Извлекаем информацию о токенах из ответа OpenRouter
            const usage: TokenUsage = {
                prompt_tokens: data.usage?.prompt_tokens || 0,
                completion_tokens: data.usage?.completion_tokens || 0,
                total_tokens: data.usage?.total_tokens || 0
            };

            return {
                content: data.choices[0]?.message?.content || 'Пустой ответ от OpenRouter',
                usage
            };
        } catch (error: any) {
            throw new Error(`Ошибка OpenRouter API: ${error.message}`);
        }
    }
}