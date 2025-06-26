import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStores } from '../contexts/StoreContext';
import { ApiProvider } from '../stores/ApiStore';
import { CaretDown, CaretRight, Eye, EyeSlash } from 'phosphor-react';

export const ApiSettings: React.FC = observer(() => {
    const { apiStore } = useStores();
    const [isExpanded, setIsExpanded] = useState(false);
    const [showKeys, setShowKeys] = useState<Record<ApiProvider, boolean>>({
        gemini: false,
        openai: false,
        openrouter: false,
        custom: false
    });

    const providerLabels: Record<ApiProvider, string> = {
        gemini: 'Google Gemini',
        openai: 'OpenAI',
        openrouter: 'OpenRouter',
        custom: 'Custom API'
    };

    const toggleKeyVisibility = (provider: ApiProvider) => {
        setShowKeys(prev => ({
            ...prev,
            [provider]: !prev[provider]
        }));
    };

    const handleProviderChange = (provider: ApiProvider) => {
        apiStore.setProvider(provider);
    };

    const handleApiKeyChange = (provider: ApiProvider, value: string) => {
        apiStore.setApiKey(provider, value);
    };

    const handleModelChange = (provider: ApiProvider, value: string) => {
        apiStore.setModel(provider, value);
    };

    const handleCustomUrlChange = (value: string) => {
        apiStore.setCustomUrl(value);
    };

    return (
        <div className="api-settings">
            <div 
                className="api-settings__header"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="api-settings__header-content">
                    {isExpanded ? (
                        <CaretDown size={16} className="api-settings__chevron" />
                    ) : (
                        <CaretRight size={16} className="api-settings__chevron" />
                    )}
                    <h3 className="api-settings__title">Настройки API</h3>
                </div>
                <div className="api-settings__status">
                    {apiStore.isConfigValid ? (
                        <span className="api-settings__status-icon api-settings__status-icon--success">✓</span>
                    ) : (
                        <span className="api-settings__status-icon api-settings__status-icon--error">⚠</span>
                    )}
                </div>
            </div>

            {isExpanded && (
                <div className="api-settings__content">
                    {/* Выбор провайдера */}
                    <div className="api-settings__section">
                        <label className="api-settings__label">
                            Провайдер AI
                        </label>
                        <div className="api-settings__provider-grid">
                            {(Object.keys(providerLabels) as ApiProvider[]).map((provider) => (
                                <div
                                    key={provider}
                                    className={`api-settings__provider-card ${
                                        apiStore.currentProvider === provider 
                                            ? 'api-settings__provider-card--active' 
                                            : ''
                                    }`}
                                    onClick={() => handleProviderChange(provider)}
                                >
                                    <div className="api-settings__provider-name">
                                        {providerLabels[provider]}
                                    </div>
                                    {apiStore.currentProvider === provider && (
                                        <div className="api-settings__provider-checkmark">✓</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Настройки для текущего провайдера */}
                    <div className="api-settings__section">
                        <label className="api-settings__label">
                            API Ключ для {providerLabels[apiStore.currentProvider]}
                        </label>
                        <div className="api-settings__input-group">
                            <input
                                type={showKeys[apiStore.currentProvider] ? 'text' : 'password'}
                                className="api-settings__input"
                                placeholder="Введите API ключ..."
                                value={apiStore.apiKeys[apiStore.currentProvider]}
                                onChange={(e) => handleApiKeyChange(apiStore.currentProvider, e.target.value)}
                            />
                            <button
                                type="button"
                                className="api-settings__eye-button"
                                onClick={() => toggleKeyVisibility(apiStore.currentProvider)}
                            >
                                {showKeys[apiStore.currentProvider] ? (
                                    <EyeSlash size={16} />
                                ) : (
                                    <Eye size={16} />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Custom URL для кастомного провайдера */}
                    {apiStore.currentProvider === 'custom' && (
                        <div className="api-settings__section">
                            <label className="api-settings__label">
                                URL API-сервера
                            </label>
                            <input
                                type="text"
                                className="api-settings__input"
                                placeholder="https://api.example.com"
                                value={apiStore.customUrl}
                                onChange={(e) => handleCustomUrlChange(e.target.value)}
                            />
                            <div className="api-settings__hint">
                                URL должен быть совместим с OpenAI API (например, /v1/chat/completions)
                            </div>
                        </div>
                    )}

                    {/* Модель */}
                    <div className="api-settings__section">
                        <label className="api-settings__label">
                            Модель
                        </label>
                        <input
                            type="text"
                            className="api-settings__input"
                            placeholder="Введите название модели..."
                            value={apiStore.models[apiStore.currentProvider]}
                            onChange={(e) => handleModelChange(apiStore.currentProvider, e.target.value)}
                        />
                        <div className="api-settings__hint">
                            Примеры: {apiStore.getAvailableModels(apiStore.currentProvider).join(', ')}
                        </div>
                    </div>

                    {/* Статус конфигурации */}
                    {!apiStore.isConfigValid && (
                        <div className="api-settings__warning">
                            <span className="api-settings__warning-icon">⚠</span>
                            <div className="api-settings__warning-text">
                                {!apiStore.apiKeys[apiStore.currentProvider] && 'API ключ не указан. '}
                                {apiStore.currentProvider === 'custom' && !apiStore.customUrl && 'URL API-сервера не указан. '}
                                Заполните все обязательные поля для отправки запросов.
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}); 