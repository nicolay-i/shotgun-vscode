import { GoogleGenerativeAI } from '@google/generative-ai';
import { IAiProvider } from './IAiProvider';
import { ApiConfig, AiResponse } from '../types';

/**
 * Провайдер для работы с Google Gemini API
 */
export class GeminiProvider implements IAiProvider {
    async sendRequest(systemPrompt: string, userPrompt: string, config: ApiConfig): Promise<AiResponse> {
        try {
            const genAI = new GoogleGenerativeAI(config.apiKey);
            const model = genAI.getGenerativeModel({
                model: config.model || 'gemini-1.5-pro'
            });

            // Объединяем системный промпт с пользовательским для Gemini
            const fullPrompt = `${systemPrompt}\n\nЗадача пользователя:\n${userPrompt}`;
            const result = await model.generateContent(fullPrompt);
            const response = result.response;
            
            // Извлекаем информацию о токенах из ответа Gemini
            const usageMetadata = (result as any).usageMetadata;
            const tokenUsage = usageMetadata ? {
                prompt_tokens: usageMetadata.promptTokenCount || 0,
                completion_tokens: usageMetadata.candidatesTokenCount || 0,
                total_tokens: usageMetadata.totalTokenCount || 0
            } : undefined;

            return {
                content: response.text(),
                usage: tokenUsage
            };
        } catch (error: any) {
            throw new Error(`Ошибка Gemini API: ${error.message}`);
        }
    }
} 