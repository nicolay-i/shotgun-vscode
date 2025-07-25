import { ApiProvider, ApiConfig } from '../types';

export interface TokenUsage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}

export interface CostCalculation {
    prompt_cost: number;
    completion_cost: number;
    total_cost: number;
    currency: string;
}

export interface ProviderPricing {
    prompt_cost_per_1k: number;
    completion_cost_per_1k: number;
    currency: string;
}

export class CostCalculationService {
    private static readonly PRICING: Record<ApiProvider, Record<string, ProviderPricing>> = {
        [ApiProvider.OpenAI]: {
            'gpt-4': { prompt_cost_per_1k: 0.03, completion_cost_per_1k: 0.06, currency: 'USD' },
            'gpt-4-turbo': { prompt_cost_per_1k: 0.01, completion_cost_per_1k: 0.03, currency: 'USD' },
            'gpt-3.5-turbo': { prompt_cost_per_1k: 0.0005, completion_cost_per_1k: 0.0015, currency: 'USD' },
            'gpt-3.5-turbo-16k': { prompt_cost_per_1k: 0.003, completion_cost_per_1k: 0.004, currency: 'USD' },
        },
        [ApiProvider.Gemini]: {
            'gemini-1.5-pro': { prompt_cost_per_1k: 0.00125, completion_cost_per_1k: 0.005, currency: 'USD' },
            'gemini-1.5-flash': { prompt_cost_per_1k: 0.000075, completion_cost_per_1k: 0.0003, currency: 'USD' },
            'gemini-pro': { prompt_cost_per_1k: 0.0005, completion_cost_per_1k: 0.0015, currency: 'USD' },
        },
        [ApiProvider.OpenRouter]: {
            'gpt-4': { prompt_cost_per_1k: 0.03, completion_cost_per_1k: 0.06, currency: 'USD' },
            'claude-3-5-sonnet': { prompt_cost_per_1k: 0.003, completion_cost_per_1k: 0.015, currency: 'USD' },
            'claude-3-opus': { prompt_cost_per_1k: 0.015, completion_cost_per_1k: 0.075, currency: 'USD' },
        },
        [ApiProvider.Custom]: {
            'default': { prompt_cost_per_1k: 0.001, completion_cost_per_1k: 0.002, currency: 'USD' },
        }
    };

    /**
     * Рассчитывает стоимость запроса на основе использования токенов
     * @param usage Информация об использовании токенов
     * @param config Конфигурация API с провайдером и моделью
     * @returns Расчет стоимости
     */
    static calculateCost(usage: TokenUsage, config: ApiConfig): CostCalculation {
        const pricing = this.getPricing(config);
        
        const prompt_cost = (usage.prompt_tokens / 1000) * pricing.prompt_cost_per_1k;
        const completion_cost = (usage.completion_tokens / 1000) * pricing.completion_cost_per_1k;
        const total_cost = prompt_cost + completion_cost;

        return {
            prompt_cost: Math.round(prompt_cost * 100000) / 100000, // Округление до 5 знаков
            completion_cost: Math.round(completion_cost * 100000) / 100000,
            total_cost: Math.round(total_cost * 100000) / 100000,
            currency: pricing.currency
        };
    }

    /**
     * Получает цены для провайдера и модели
     * @param config Конфигурация API
     * @returns Цены на токены
     */
    private static getPricing(config: ApiConfig): ProviderPricing {
        const providerPricing = this.PRICING[config.provider];
        
        if (!providerPricing) {
            throw new Error(`Неизвестный провайдер: ${config.provider}`);
        }

        // Поиск точного совпадения модели
        if (providerPricing[config.model]) {
            return providerPricing[config.model];
        }

        // Поиск по префиксу модели (например, gpt-4-turbo -> gpt-4)
        for (const [model, pricing] of Object.entries(providerPricing)) {
            if (config.model.toLowerCase().includes(model.toLowerCase())) {
                return pricing;
            }
        }

        // Возврат дефолтной цены для Custom провайдера
        if (config.provider === ApiProvider.Custom) {
            return providerPricing['default'];
        }

        // Возврат первой доступной цены как fallback
        return Object.values(providerPricing)[0];
    }

    /**
     * Добавляет или обновляет цены для провайдера и модели
     * @param provider Провайдер
     * @param model Модель
     * @param pricing Цены
     */
    static setPricing(provider: ApiProvider, model: string, pricing: ProviderPricing): void {
        if (!this.PRICING[provider]) {
            this.PRICING[provider] = {};
        }
        this.PRICING[provider][model] = pricing;
    }

    /**
     * Получает все доступные цены
     * @returns Объект с ценами для всех провайдеров и моделей
     */
    static getAllPricing(): Record<ApiProvider, Record<string, ProviderPricing>> {
        return { ...this.PRICING };
    }
}