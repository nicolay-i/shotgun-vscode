import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import fetch from 'node-fetch';
import { ApiConfig, PromptTemplate, SelectedFile } from './types';

export class ApiService {
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

    async sendRequest(
        prompt: string,
        selectedFiles: SelectedFile[],
        config: ApiConfig,
        template?: PromptTemplate
    ): Promise<string> {
        const { systemPrompt, userPrompt } = this.formatPrompt(template, prompt, selectedFiles);

        switch (config.provider) {
            case 'gemini':
                return this.sendGeminiRequest(systemPrompt, userPrompt, config);
            case 'openai':
                return this.sendOpenAIRequest(systemPrompt, userPrompt, config);
            case 'openrouter':
                return this.sendOpenRouterRequest(systemPrompt, userPrompt, config);
            case 'custom':
                return this.sendCustomRequest(systemPrompt, userPrompt, config);
            default:
                throw new Error(`Неподдерживаемый API провайдер: ${config.provider}`);
        }
    }

    private async sendGeminiRequest(
        systemPrompt: string,
        userPrompt: string,
        config: ApiConfig
    ): Promise<string> {
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

    private async sendOpenAIRequest(
        systemPrompt: string,
        userPrompt: string,
        config: ApiConfig
    ): Promise<string> {
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

    private async sendOpenRouterRequest(
        systemPrompt: string,
        userPrompt: string,
        config: ApiConfig
    ): Promise<string> {
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
            return data.choices[0]?.message?.content || 'Пустой ответ от OpenRouter';
        } catch (error: any) {
            throw new Error(`Ошибка OpenRouter API: ${error.message}`);
        }
    }

    private async sendCustomRequest(
        systemPrompt: string,
        userPrompt: string,
        config: ApiConfig
    ): Promise<string> {
        try {
            if (!config.customUrl) {
                throw new Error('Не указан URL для кастомного API');
            }

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
} 