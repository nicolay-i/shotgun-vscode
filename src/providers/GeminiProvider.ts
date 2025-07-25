import { GoogleGenerativeAI } from '@google/generative-ai';
import { IAiProvider, AIResponse, TokenUsage } from './IAiProvider';
import { ApiConfig } from '../types';

/**
 * Провайдер для работы с Google Gemini API
 */
export class GeminiProvider implements IAiProvider {
    async sendRequest(systemPrompt: string, userPrompt: string, config: ApiConfig): Promise<AIResponse> {
        try {
            const genAI = new GoogleGenerativeAI(config.apiKey);
            const model = genAI.getGenerativeModel({ 
                model: config.model || 'gemini-1.5-pro'
            });

            // Объединяем системный промпт с пользовательским для Gemini
            const fullPrompt = `${systemPrompt}\n\nЗадача пользователя:\n${userPrompt}`;
            const result = await model.generateContent(fullPrompt);
            const response = result.response;
            
            // Gemini не предоставляет информацию о токенах в ответе
            // Используем эвристическую оценку
            const promptTokens = Math.ceil((systemPrompt.length + userPrompt.length) / 4);
            const completionTokens = Math.ceil((response.text()?.length || 0) / 4);
            
            const usage: TokenUsage = {
                prompt_tokens: promptTokens,
                completion_tokens: completionTokens,
                total_tokens: promptTokens + completionTokens
            };

            return {
                content: response.text() || 'Пустой ответ от Gemini',
                usage
            };
        } catch (error: any) {
            throw new Error(`Ошибка Gemini API: ${error.message}`);
        }
    }
}