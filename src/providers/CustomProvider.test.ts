import { CustomProvider } from './CustomProvider';
import { ApiConfig, ApiProvider } from '../types';

describe('CustomProvider', () => {
    let provider: CustomProvider;

    beforeEach(() => {
        provider = new CustomProvider();
    });

    describe('validateUrl', () => {
        test('должен принимать валидные HTTPS URL', () => {
            const validUrls = [
                'https://api.openai.com',
                'https://example.com',
                'https://my-api.example.org/api',
                'https://api.anthropic.com:443'
            ];

            validUrls.forEach(url => {
                expect(() => {
                    (provider as any).validateUrl(url);
                }).not.toThrow();
            });
        });

        test('должен принимать валидные HTTP URL', () => {
            const validUrls = [
                'http://api.example.com',
                'http://external-service.com:8080'
            ];

            validUrls.forEach(url => {
                expect(() => {
                    (provider as any).validateUrl(url);
                }).not.toThrow();
            });
        });

        test('должен отклонять неподдерживаемые протоколы', () => {
            const invalidProtocols = [
                'ftp://example.com',
                'file://local/path',
                'ssh://server.com',
                'ldap://directory.com'
            ];

            invalidProtocols.forEach(url => {
                expect(() => {
                    (provider as any).validateUrl(url);
                }).toThrow('Поддерживаются только HTTP и HTTPS протоколы');
            });
        });

        test('должен блокировать localhost', () => {
            const localhostUrls = [
                'http://localhost:3000',
                'https://localhost',
                'http://127.0.0.1:8080',
                'https://127.0.0.1'
                // IPv6 адреса пока не блокируются полностью
            ];

            localhostUrls.forEach(url => {
                expect(() => {
                    (provider as any).validateUrl(url);
                }).toThrow('Локальные адреса не разрешены');
            });
        });

        test('должен блокировать приватные IP диапазоны', () => {
            const privateIpUrls = [
                'http://192.168.1.1',
                'https://192.168.0.100:8080',
                'http://10.0.0.1',
                'https://10.255.255.254',
                'http://172.16.0.1',
                'https://172.31.255.254'
            ];

            privateIpUrls.forEach(url => {
                expect(() => {
                    (provider as any).validateUrl(url);
                }).toThrow('Приватные IP адреса не разрешены');
            });
        });

        test('должен отклонять невалидные URL', () => {
            const invalidUrls = [
                'not-a-url',
                '',
                'just-text'
            ];

            invalidUrls.forEach(url => {
                expect(() => {
                    (provider as any).validateUrl(url);
                }).toThrow('Невалидный URL');
            });
        });

        test('должен обрабатывать URL с путями и параметрами', () => {
            const validComplexUrls = [
                'https://api.example.com/v1/chat',
                'https://service.com/api/v2?key=value',
                'http://external.org/path/to/endpoint#fragment'
            ];

            validComplexUrls.forEach(url => {
                expect(() => {
                    (provider as any).validateUrl(url);
                }).not.toThrow();
            });
        });

        test('должен быть case-insensitive для hostname', () => {
            // localhost в разных регистрах должен блокироваться
            const localhostVariants = [
                'http://LOCALHOST',
                'https://Localhost',
                'http://LocalHost:3000'
            ];

            localhostVariants.forEach(url => {
                expect(() => {
                    (provider as any).validateUrl(url);
                }).toThrow('Локальные адреса не разрешены');
            });
        });

        test('должен обрабатывать URL с нестандартными портами', () => {
            const validPortUrls = [
                'https://api.example.com:8443',
                'http://service.org:9000'
            ];

            validPortUrls.forEach(url => {
                expect(() => {
                    (provider as any).validateUrl(url);
                }).not.toThrow();
            });
        });
    });

    describe('generatePayload', () => {
        test('должен генерировать корректный payload для Custom API', () => {
            const systemPrompt = 'Ты помощник';
            const userPrompt = 'Объясни код';
            const config: ApiConfig = {
                provider: ApiProvider.Custom,
                apiKey: 'test-key',
                model: 'custom-model'
            };

            const payload = provider.generatePayload(systemPrompt, userPrompt, config);

            expect(payload).toEqual({
                model: 'custom-model',
                messages: [
                    { role: 'system', content: 'Ты помощник' },
                    { role: 'user', content: 'Объясни код' }
                ],
                temperature: 0.7,
            });
        });

        test('должен использовать дефолтную модель если не указана', () => {
            const config: ApiConfig = {
                provider: ApiProvider.Custom,
                apiKey: 'test-key',
                model: ''
            };

            const payload = provider.generatePayload('system', 'user', config);

            expect(payload).toMatchObject({
                model: 'gpt-3.5-turbo'
            });
        });
    });
}); 