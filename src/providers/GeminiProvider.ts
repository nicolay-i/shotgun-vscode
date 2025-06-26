import { GoogleGenerativeAI } from '@google/generative-ai';
import { IAiProvider } from './IAiProvider';
import { ApiConfig } from '../types';

/**
 * Провайдер для работы с Google Gemini API
 */
export class GeminiProvider implements IAiProvider {
    async sendRequest(systemPrompt: string, userPrompt: string, config: ApiConfig): Promise<string> {
        try {
            const genAI = new GoogleGenerativeAI(config.apiKey);
            const model = genAI.getGenerativeModel({ 
                model: config.model || 'gemini-1.5-pro'
            });

            // Объединяем системный промпт с пользовательским для Gemini
            const fullPrompt = `${systemPrompt}\n\nЗадача пользователя:\n${userPrompt}`;
            const result = await model.generateContent(fullPrompt);
            const response = result.response;
            return response.text();
        } catch (error: any) {
            throw new Error(`Ошибка Gemini API: ${error.message}`);
        }
    }
} 