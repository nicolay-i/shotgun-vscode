import { IAiProvider } from './IAiProvider';
import { GeminiProvider } from './GeminiProvider';
import { OpenAiProvider } from './OpenAiProvider';
import { OpenRouterProvider } from './OpenRouterProvider';
import { CustomProvider } from './CustomProvider';
import { ApiProvider } from '../types';

/**
 * Фабрика для создания провайдеров AI-сервисов
 * Реализует паттерн "Фабрика" для упрощения управления провайдерами
 */
export class ProviderFactory {
    private static providers: Map<ApiProvider, IAiProvider> = new Map([
        [ApiProvider.Gemini, new GeminiProvider()],
        [ApiProvider.OpenAI, new OpenAiProvider()],
        [ApiProvider.OpenRouter, new OpenRouterProvider()],
        [ApiProvider.Custom, new CustomProvider()],
    ]);

    /**
     * Получает провайдер по типу
     * @param provider Тип провайдера
     * @returns Экземпляр провайдера
     * @throws Error если провайдер не поддерживается
     */
    static getProvider(provider: ApiProvider): IAiProvider {
        const aiProvider = this.providers.get(provider);
        if (!aiProvider) {
            throw new Error(`Неподдерживаемый API провайдер: ${provider}`);
        }
        return aiProvider;
    }

    /**
     * Регистрирует новый провайдер
     * @param provider Тип провайдера
     * @param implementation Реализация провайдера
     */
    static registerProvider(provider: ApiProvider, implementation: IAiProvider): void {
        this.providers.set(provider, implementation);
    }

    /**
     * Получает список всех зарегистрированных провайдеров
     * @returns Массив типов провайдеров
     */
    static getRegisteredProviders(): ApiProvider[] {
        return Array.from(this.providers.keys());
    }
} 