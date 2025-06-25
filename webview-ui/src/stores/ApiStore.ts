import { makeAutoObservable, action } from 'mobx';

export type ApiProvider = 'gemini' | 'openai' | 'openrouter' | 'custom';

export interface ApiConfig {
    provider: ApiProvider;
    apiKey: string;
    customUrl?: string;
    model: string;
}

export class ApiStore {
    currentProvider: ApiProvider = 'gemini';
    apiKeys: Record<ApiProvider, string> = {
        gemini: '',
        openai: '',
        openrouter: '',
        custom: ''
    };
    customUrl: string = '';
    models: Record<ApiProvider, string> = {
        gemini: 'gemini-1.5-pro',
        openai: 'gpt-4',
        openrouter: 'anthropic/claude-3-sonnet',
        custom: 'gpt-3.5-turbo'
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
        if (config.provider === 'custom' && !config.customUrl) return false;
        return true;
    }

    // Простейшее "шифрование" для localStorage (base64)
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
            apiKeys: {
                gemini: this.encryptKey(this.apiKeys.gemini),
                openai: this.encryptKey(this.apiKeys.openai),
                openrouter: this.encryptKey(this.apiKeys.openrouter),
                custom: this.encryptKey(this.apiKeys.custom),
            },
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
                
                if (state.currentProvider) {
                    this.currentProvider = state.currentProvider;
                }
                
                if (state.apiKeys) {
                    this.apiKeys = {
                        gemini: this.decryptKey(state.apiKeys.gemini || ''),
                        openai: this.decryptKey(state.apiKeys.openai || ''),
                        openrouter: this.decryptKey(state.apiKeys.openrouter || ''),
                        custom: this.decryptKey(state.apiKeys.custom || ''),
                    };
                }
                
                if (state.customUrl) {
                    this.customUrl = state.customUrl;
                }
                
                if (state.models) {
                    this.models = { ...this.models, ...state.models };
                }
            }
        } catch (error) {
            console.warn('Ошибка загрузки состояния ApiStore:', error);
        }
    }

    // Предустановленные модели для каждого провайдера
    getAvailableModels(provider: ApiProvider): string[] {
        switch (provider) {
            case 'gemini':
                return [
                    'gemini-1.5-pro',
                    'gemini-1.5-flash',
                    'gemini-pro'
                ];
            case 'openai':
                return [
                    'gpt-4',
                    'gpt-4-turbo',
                    'gpt-3.5-turbo'
                ];
            case 'openrouter':
                return [
                    'anthropic/claude-3-sonnet',
                    'anthropic/claude-3-haiku',
                    'openai/gpt-4',
                    'openai/gpt-3.5-turbo',
                    'meta-llama/llama-3-70b-instruct'
                ];
            case 'custom':
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