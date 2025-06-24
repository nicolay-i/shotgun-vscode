import { GoogleGenerativeAI } from '@google/generative-ai';
import { ApiConfig, ApiResponse, SelectedFile } from '../types/ApiTypes';

export class ApiService {
    
    static async callAI(prompt: string, selectedFiles: SelectedFile[], config: ApiConfig): Promise<ApiResponse> {
        try {
            let fullPrompt = prompt + '\n\n--- Содержимое файлов ---\n\n';
            
            for (const file of selectedFiles) {
                fullPrompt += `=== ${file.path} ===\n${file.content}\n\n`;
            }

            switch (config.provider) {
                case 'gemini':
                    return await this.callGemini(fullPrompt, config);
                case 'openai':
                    return await this.callOpenAI(fullPrompt, config);
                case 'openrouter':
                    return await this.callOpenRouter(fullPrompt, config);
                case 'custom':
                    return await this.callCustomAPI(fullPrompt, config);
                default:
                    return { success: false, error: 'Неподдерживаемый провайдер API' };
            }
        } catch (error) {
            return { success: false, error: `Ошибка API: ${error}` };
        }
    }

    private static async callGemini(prompt: string, config: ApiConfig): Promise<ApiResponse> {
        try {
            if (!config.geminiApiKey) {
                return { success: false, error: 'Gemini API ключ не установлен' };
            }

            const genAI = new GoogleGenerativeAI(config.geminiApiKey);
            const model = genAI.getGenerativeModel({ 
                model: config.model || "gemini-pro" 
            });

            const result = await model.generateContent(prompt);
            const response = result.response.text();

            return { success: true, data: response };
        } catch (error) {
            return { success: false, error: `Ошибка Gemini API: ${error}` };
        }
    }

    private static async callOpenAI(prompt: string, config: ApiConfig): Promise<ApiResponse> {
        try {
            if (!config.openaiApiKey) {
                return { success: false, error: 'OpenAI API ключ не установлен' };
            }

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.openaiApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: config.model || 'gpt-4',
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 4000,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                return { success: false, error: `OpenAI API ошибка: ${errorData.error?.message || response.statusText}` };
            }

            const data = await response.json();
            return { success: true, data: data.choices[0].message.content };
        } catch (error) {
            return { success: false, error: `Ошибка OpenAI API: ${error}` };
        }
    }

    private static async callOpenRouter(prompt: string, config: ApiConfig): Promise<ApiResponse> {
        try {
            if (!config.openrouterApiKey) {
                return { success: false, error: 'OpenRouter API ключ не установлен' };
            }

            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.openrouterApiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://github.com/your-username/shotgun-vscode',
                    'X-Title': 'Shotgun VSCode Extension'
                },
                body: JSON.stringify({
                    model: config.model || 'anthropic/claude-3-opus',
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 4000,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                return { success: false, error: `OpenRouter API ошибка: ${errorData.error?.message || response.statusText}` };
            }

            const data = await response.json();
            return { success: true, data: data.choices[0].message.content };
        } catch (error) {
            return { success: false, error: `Ошибка OpenRouter API: ${error}` };
        }
    }

    private static async callCustomAPI(prompt: string, config: ApiConfig): Promise<ApiResponse> {
        try {
            if (!config.customApiUrl) {
                return { success: false, error: 'URL кастомного API не установлен' };
            }

            const headers: { [key: string]: string } = {
                'Content-Type': 'application/json'
            };

            if (config.customApiKey) {
                headers['Authorization'] = `Bearer ${config.customApiKey}`;
            }

            const response = await fetch(`${config.customApiUrl}/chat/completions`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    model: config.model || 'default',
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 4000,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
                return { success: false, error: `Кастомный API ошибка: ${errorData.error?.message || response.statusText}` };
            }

            const data = await response.json();
            
            // Пытаемся извлечь ответ в зависимости от формата API
            let responseText = '';
            if (data.choices && data.choices[0] && data.choices[0].message) {
                responseText = data.choices[0].message.content;
            } else if (data.response) {
                responseText = data.response;
            } else if (data.text) {
                responseText = data.text;
            } else {
                responseText = JSON.stringify(data);
            }

            return { success: true, data: responseText };
        } catch (error) {
            return { success: false, error: `Ошибка кастомного API: ${error}` };
        }
    }
} 