import { GoogleGenerativeAI } from '@google/generative-ai';
import { IAiProvider } from './IAiProvider';
import { ApiConfig, UsageData } from '../types';

/**
 * Провайдер для работы с Google Gemini API
 */
export class GeminiProvider implements IAiProvider {
    async sendRequest(systemPrompt: string, userPrompt: string, config: ApiConfig): Promise<{ response: string; usage: UsageData }> {
        try {
            const genAI = new GoogleGenerativeAI(config.apiKey);
            const model = genAI.getGenerativeModel({
                model: config.model || 'gemini-1.5-pro'
            });

            // Объединяем системный промпт с пользовательским для Gemini
            const fullPrompt = `${systemPrompt}\n\nЗадача пользователя:\n${userPrompt}`;
            const result = await model.generateContent(fullPrompt);
            const response = result.response;
            const text = response.text();

            //一定是 Gemini provides usage data in usageMetadata
            const usageMeta = (response as any).usageMetadata;
            const usage: UsageData = {
                prompt_tokens: usageMeta?.promptTokenCount || 0,
                completion_tokens: usageMeta?.candidatesTokenCount || 0,
                total_tokens: usageMeta?.totalTokenCount || 0
            };

            return {
                response: text,
                usage
            };
        } catch (error: any) {
            throw new Error(`Ошибка Gemini API: ${error.message}`);
        }
    }
}