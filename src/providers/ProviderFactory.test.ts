import { ProviderFactory } from './ProviderFactory';
import { ApiProvider } from '../types';
import { IAiProvider } from './IAiProvider';

describe('ProviderFactory', () => {
    beforeEach(() => {
        // Сбрасываем состояние фабрики перед каждым тестом
        jest.clearAllMocks();
    });

    describe('getProvider', () => {
        test('должен возвращать OpenAI провайдер', () => {
            const provider = ProviderFactory.getProvider(ApiProvider.OpenAI);
            expect(provider).toBeDefined();
            expect(provider.constructor.name).toBe('OpenAiProvider');
        });

        test('должен возвращать Gemini провайдер', () => {
            const provider = ProviderFactory.getProvider(ApiProvider.Gemini);
            expect(provider).toBeDefined();
            expect(provider.constructor.name).toBe('GeminiProvider');
        });

        test('должен возвращать OpenRouter провайдер', () => {
            const provider = ProviderFactory.getProvider(ApiProvider.OpenRouter);
            expect(provider).toBeDefined();
            expect(provider.constructor.name).toBe('OpenRouterProvider');
        });

        test('должен возвращать Custom провайдер', () => {
            const provider = ProviderFactory.getProvider(ApiProvider.Custom);
            expect(provider).toBeDefined();
            expect(provider.constructor.name).toBe('CustomProvider');
        });

        test('должен возвращать одинаковый экземпляр при повторных вызовах', () => {
            const provider1 = ProviderFactory.getProvider(ApiProvider.OpenAI);
            const provider2 = ProviderFactory.getProvider(ApiProvider.OpenAI);
            expect(provider1).toBe(provider2);
        });

        test('должен бросать ошибку для неизвестного провайдера', () => {
            // Принудительно передаем неизвестный провайдер
            const unknownProvider = 'unknown' as ApiProvider;
            expect(() => {
                ProviderFactory.getProvider(unknownProvider);
            }).toThrow('Неподдерживаемый API провайдер: unknown');
        });
    });

    describe('registerProvider', () => {
        test('должен регистрировать новый провайдер', () => {
            const mockProvider: IAiProvider = {
                sendRequest: jest.fn(),
                generatePayload: jest.fn()
            };
            
            const customType = 'test' as ApiProvider;
            ProviderFactory.registerProvider(customType, mockProvider);
            
            const retrievedProvider = ProviderFactory.getProvider(customType);
            expect(retrievedProvider).toBe(mockProvider);
        });

        test('должен перезаписывать существующий провайдер', () => {
            const mockProvider: IAiProvider = {
                sendRequest: jest.fn(),
                generatePayload: jest.fn()
            };
            
            ProviderFactory.registerProvider(ApiProvider.OpenAI, mockProvider);
            
            const retrievedProvider = ProviderFactory.getProvider(ApiProvider.OpenAI);
            expect(retrievedProvider).toBe(mockProvider);
            expect(retrievedProvider.constructor.name).not.toBe('OpenAiProvider');
        });
    });

    describe('getRegisteredProviders', () => {
        test('должен возвращать список всех зарегистрированных провайдеров', () => {
            const providers = ProviderFactory.getRegisteredProviders();
            
            expect(providers).toContain(ApiProvider.OpenAI);
            expect(providers).toContain(ApiProvider.Gemini);
            expect(providers).toContain(ApiProvider.OpenRouter);
            expect(providers).toContain(ApiProvider.Custom);
            expect(providers.length).toBeGreaterThanOrEqual(4);
        });

        test('должен включать новые зарегистрированные провайдеры', () => {
            const mockProvider: IAiProvider = {
                sendRequest: jest.fn(),
                generatePayload: jest.fn()
            };
            
            const customType = 'test' as ApiProvider;
            ProviderFactory.registerProvider(customType, mockProvider);
            
            const providers = ProviderFactory.getRegisteredProviders();
            expect(providers).toContain(customType);
            expect(providers.length).toBe(5);
        });
    });
}); 