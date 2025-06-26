import { makeAutoObservable, action } from 'mobx';

export enum ApiProvider {
    Gemini = 'gemini',
    OpenAI = 'openai',
    OpenRouter = 'openrouter',
    Custom = 'custom'
}

export interface ApiConfig {
    provider: ApiProvider;
    apiKey: string;
    customUrl?: string;
    model: string;
}

export class ApiStore {
    currentProvider: ApiProvider = ApiProvider.Gemini;
    apiKeys: Record<ApiProvider, string> = {
        [ApiProvider.Gemini]: '',
        [ApiProvider.OpenAI]: '',
        [ApiProvider.OpenRouter]: '',
        [ApiProvider.Custom]: ''
    };
    customUrl: string = '';
    models: Record<ApiProvider, string> = {
        [ApiProvider.Gemini]: 'gemini-1.5-pro',
        [ApiProvider.OpenAI]: 'gpt-4',
        [ApiProvider.OpenRouter]: 'anthropic/claude-3-sonnet',
        [ApiProvider.Custom]: 'gpt-3.5-turbo'
    };

    constructor() {
        makeAutoObservable(this, {
            setProvider: action,
            setApiKey: action,
            setCustomUrl: action,
            setModel: action
        });

        this.loadPersistedState();
    }

    setProvider(provider: ApiProvider) {
        this.currentProvider = provider;
        this.savePersistedState();
    }

    setApiKey(provider: ApiProvider, key: string) {
        this.apiKeys[provider] = key;
        this.savePersistedState();
        
        // Отправляем сообщение в extension для сохранения в SecretStorage
        this.requestSecretStorage(provider, key);
    }

    setCustomUrl(url: string) {
        this.customUrl = url;
        this.savePersistedState();
    }

    setModel(provider: ApiProvider, model: string) {
        this.models[provider] = model;
        this.savePersistedState();
    }

    get currentApiConfig(): ApiConfig {
        return {
            provider: this.currentProvider,
            apiKey: this.apiKeys[this.currentProvider],
            customUrl: this.customUrl,
            model: this.models[this.currentProvider]
        };
    }

    get isConfigValid(): boolean {
        const config = this.currentApiConfig;
        if (!config.apiKey) return false;
        if (config.provider === ApiProvider.Custom && !config.customUrl) return false;
        return true;
    }

    /**
     * Запрашивает сохранение API ключа в безопасном хранилище VS Code
     * @param provider Провайдер API
     * @param key API ключ
     */
    private requestSecretStorage(provider: ApiProvider, key: string) {
        const vsCodeApi = (window as any).vscode;
        if (vsCodeApi) {
            vsCodeApi.postMessage({
                type: 'storeSecret',
                data: {
                    key: `ai-assistant.apiKey.${provider}`,
                    value: key
                }
            });
        }
    }

    /**
     * Загружает API ключи из безопасного хранилища
     * @param secrets Объект с секретами из VS Code
     */
    loadSecretsFromVsCode(secrets: Partial<Record<ApiProvider, string>>) {
        Object.entries(secrets).forEach(([provider, key]) => {
            if (key && Object.values(ApiProvider).includes(provider as ApiProvider)) {
                this.apiKeys[provider as ApiProvider] = key;
            }
        });
    }

    /**
     * Обрабатывает сообщения от VS Code Extension
     * @param message Сообщение от extension
     */
    handleMessage(message: any) {
        if (message.type === 'secretsLoaded') {
            this.loadSecretsFromVsCode(message.data);
        }
    }

    // Простейшее "шифрование" для localStorage (base64) - только для некритичных данных
    private encryptKey(key: string): string {
        if (!key) return '';
        return btoa(key);
    }

    private decryptKey(encryptedKey: string): string {
        if (!encryptedKey) return '';
        try {
            return atob(encryptedKey);
        } catch {
            return '';
        }
    }

    private savePersistedState() {
        const state = {
            currentProvider: this.currentProvider,
            // Больше не сохраняем API ключи в localStorage - они идут в SecretStorage
            customUrl: this.customUrl,
            models: this.models
        };
        localStorage.setItem('apiStore', JSON.stringify(state));
    }

    private loadPersistedState() {
        try {
            const saved = localStorage.getItem('apiStore');
            if (saved) {
                const state = JSON.parse(saved);
                
                if (state.currentProvider && Object.values(ApiProvider).includes(state.currentProvider)) {
                    this.currentProvider = state.currentProvider;
                }
                
                if (state.customUrl) {
                    this.customUrl = state.customUrl;
                }
                
                if (state.models) {
                    this.models = { ...this.models, ...state.models };
                }

                // Если есть старые ключи в localStorage, переносим их в SecretStorage и удаляем
                if (state.apiKeys) {
                    Object.entries(state.apiKeys).forEach(([provider, encryptedKey]) => {
                        if (encryptedKey && typeof encryptedKey === 'string') {
                            const decryptedKey = this.decryptKey(encryptedKey);
                            if (decryptedKey && Object.values(ApiProvider).includes(provider as ApiProvider)) {
                                this.requestSecretStorage(provider as ApiProvider, decryptedKey);
                            }
                        }
                    });
                    
                    // Удаляем ключи из localStorage после переноса
                    delete state.apiKeys;
                    localStorage.setItem('apiStore', JSON.stringify(state));
                }
            }

            // Запрашиваем загрузку секретов из VS Code
            this.requestSecretsLoad();
        } catch (error) {
            console.warn('Ошибка загрузки состояния ApiStore:', error);
        }
    }

    /**
     * Запрашивает загрузку секретов из VS Code SecretStorage
     */
    private requestSecretsLoad() {
        const vsCodeApi = (window as any).vscode;
        if (vsCodeApi) {
            vsCodeApi.postMessage({
                type: 'loadSecrets',
                data: {}
            });
        }
    }

    // Предустановленные модели для каждого провайдера
    getAvailableModels(provider: ApiProvider): string[] {
        switch (provider) {
            case ApiProvider.Gemini:
                return [
                    'gemini-1.5-pro',
                    'gemini-1.5-flash',
                    'gemini-pro'
                ];
            case ApiProvider.OpenAI:
                return [
                    'gpt-4',
                    'gpt-4-turbo',
                    'gpt-3.5-turbo'
                ];
            case ApiProvider.OpenRouter:
                return [
                    'anthropic/claude-3-sonnet',
                    'anthropic/claude-3-haiku',
                    'openai/gpt-4',
                    'openai/gpt-3.5-turbo',
                    'meta-llama/llama-3-70b-instruct'
                ];
            case ApiProvider.Custom:
                return [
                    'gpt-3.5-turbo',
                    'gpt-4',
                    'custom-model'
                ];
            default:
                return [];
        }
    }
} 