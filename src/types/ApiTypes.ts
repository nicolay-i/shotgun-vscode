export type ApiProvider = 'openai' | 'gemini' | 'openrouter' | 'custom';

export interface ApiConfig {
    provider: ApiProvider;
    openaiApiKey: string;
    geminiApiKey: string;
    openrouterApiKey: string;
    customApiUrl: string;
    customApiKey: string;
    model: string;
}

export interface ApiResponse {
    success: boolean;
    data?: string;
    error?: string;
}

export interface SelectedFile {
    path: string;
    content: string;
}

// Типы для системы шаблонов
export type TemplateCategory = 'code-editing' | 'improvement-plan' | 'refactoring-plan' | 'custom';

export interface PromptTemplate {
    id: string;
    name: string;
    description: string;
    systemPrompt: string;
    userPrompt: string;
    category: TemplateCategory;
    isBuiltIn: boolean;
    createdAt: Date;
    updatedAt: Date;
} 