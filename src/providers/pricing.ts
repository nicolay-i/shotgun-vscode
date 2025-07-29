import { ApiProvider } from '../types';
import { ModelPricing } from '../types';

// Цены на токены для разных провайдеров и моделей (в USD за 1000 токенов)
export const MODEL_PRICING: ModelPricing[] = [
    // OpenAI
    { provider: ApiProvider.OpenAI, model: 'gpt-4o', input_cost_per_1k: 0.005, output_cost_per_1k: 0.015 },
    { provider: ApiProvider.OpenAI, model: 'gpt-4o-mini', input_cost_per_1k: 0.00015, output_cost_per_1k: 0.0006 },
    { provider: ApiProvider.OpenAI, model: 'gpt-4-turbo', input_cost_per_1k: 0.01, output_cost_per_1k: 0.03 },
    { provider: ApiProvider.OpenAI, model: 'gpt-3.5-turbo', input_cost_per_1k: 0.0005, output_cost_per_1k: 0.0015 },
    
    // Gemini
    { provider: ApiProvider.Gemini, model: 'gemini-1.5-pro', input_cost_per_1k: 0.00125, output_cost_per_1k: 0.005 },
    { provider: ApiProvider.Gemini, model: 'gemini-1.5-flash', input_cost_per_1k: 0.000075, output_cost_per_1k: 0.0003 },
    { provider: ApiProvider.Gemini, model: 'gemini-1.0-pro', input_cost_per_1k: 0.0005, output_cost_per_1k: 0.0015 },
    
    // OpenRouter
    { provider: ApiProvider.OpenRouter, model: 'anthropic/claude-3-5-sonnet', input_cost_per_1k: 0.003, output_cost_per_1k: 0.015 },
    { provider: ApiProvider.OpenRouter, model: 'anthropic/claude-3-5-haiku', input_cost_per_1k: 0.0008, output_cost_per_1k: 0.004 },
    { provider: ApiProvider.OpenRouter, model: 'deepseek/deepseek-chat', input_cost_per_1k: 0.00014, output_cost_per_1k: 0.00028 },
];

// Функция для получения цен для модели
export function getModelPricing(provider: ApiProvider, model: string | undefined): ModelPricing | undefined {
    const actualModel = model || getDefaultModel(provider);
    let pricing = MODEL_PRICING.find(p => p.provider === provider && p.model === actualModel);
    
    // Попробуем найти частичное совпадение по имени модели
    if (!pricing && actualModel) {
        pricing = MODEL_PRICING.find(p => 
            p.provider === provider && 
            (p.model.includes(actualModel) || actualModel.includes(p.model))
        );
    }
    
    // Если не нашли, вернем дефолтные цены для провайдера
    if (!pricing) {
        const defaultPricing = {
            [ApiProvider.OpenAI]: { input_cost_per_1k: 0.005, output_cost_per_1k: 0.015 },
            [ApiProvider.Gemini]: { input_cost_per_1k: 0.00125, output_cost_per_1k: 0.005 },
            [ApiProvider.OpenRouter]: { input_cost_per_1k: 0.003, output_cost_per_1k: 0.015 },
            [ApiProvider.Custom]: { input_cost_per_1k: 0.001, output_cost_per_1k: 0.003 },
        }[provider];
        
        if (defaultPricing) {
            return {
                provider,
                model: actualModel || 'default',
                ...defaultPricing
            };
        }
    }
    
    return pricing;
}

// Функция для получения дефолтной модели по провайдеру
export function getDefaultModel(provider: ApiProvider): string {
    switch (provider) {
        case ApiProvider.OpenAI:
            return 'gpt-4o';
        case ApiProvider.Gemini:
            return 'gemini-1.5-pro';
        case ApiProvider.OpenRouter:
            return 'anthropic/claude-3-5-sonnet';
        case ApiProvider.Custom:
            return 'custom-model';
        default:
            return 'unknown-model';
    }
}

/**
 * Рассчитывает стоимость запроса и ответа
 * @param provider Провайдер AI
 * @param model Название модели
 * @param usage Данные об использовании токенов
 * @returns Объект с итоговой стоимостью и деталями
 */
export function calculateCost(
    provider: ApiProvider,
    model: string | undefined,
    usage: { prompt_tokens: number; completion_tokens: number }
): { totalCost: number; promptCost: number; completionCost: number; currency: string } {
    const pricing = getModelPricing(provider, model);
    
    if (!pricing) {
        return {
            totalCost: 0,
            promptCost: 0,
            completionCost: 0,
            currency: 'USD'
        };
    }

    const promptCost = (usage.prompt_tokens / 1000) * pricing.input_cost_per_1k;
    const completionCost = (usage.completion_tokens / 1000) * pricing.output_cost_per_1k;
    const totalCost = promptCost + completionCost;

    return {
        totalCost,
        promptCost,
        completionCost,
        currency: 'USD'
    };
}