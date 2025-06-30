import { OpenAiProvider } from './OpenAiProvider';
import { ApiConfig, ApiProvider } from '../types';

describe('OpenAiProvider', () => {
    let provider: OpenAiProvider;

    beforeEach(() => {
        provider = new OpenAiProvider();
    });

    describe('generatePayload', () => {
        test('должен генерировать корректный payload для OpenAI', () => {
            const systemPrompt = 'Ты помощник';
            const userPrompt = 'Объясни код';
            const config: ApiConfig = {
                provider: ApiProvider.OpenAI,
                apiKey: 'test-key',
                model: 'gpt-4'
            };

            const payload = provider.generatePayload(systemPrompt, userPrompt, config);

            expect(payload).toEqual({
                model: 'gpt-4',
                messages: [
                    { role: 'system', content: 'Ты помощник' },
                    { role: 'user', content: 'Объясни код' }
                ],
                temperature: 0.7,
            });
        });

        test('должен использовать дефолтную модель если не указана', () => {
            const config: ApiConfig = {
                provider: ApiProvider.OpenAI,
                apiKey: 'test-key',
                model: ''
            };

            const payload = provider.generatePayload('system', 'user', config);

            expect(payload).toMatchObject({
                model: 'gpt-4'
            });
        });

        test('должен использовать указанную модель', () => {
            const config: ApiConfig = {
                provider: ApiProvider.OpenAI,
                apiKey: 'test-key',
                model: 'gpt-3.5-turbo'
            };

            const payload = provider.generatePayload('system', 'user', config);

            expect(payload).toMatchObject({
                model: 'gpt-3.5-turbo'
            });
        });
    });
}); 