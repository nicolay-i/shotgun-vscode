import React, { useState, useEffect } from 'react';
import { CaretDown, Gear, Key, Globe, Database } from 'phosphor-react';

interface ApiSettingsProps {
    isExpanded: boolean;
    onToggle: () => void;
}

type ApiProvider = 'openai' | 'gemini' | 'openrouter' | 'custom';

interface ApiConfig {
    provider: ApiProvider;
    openaiApiKey: string;
    geminiApiKey: string;
    openrouterApiKey: string;
    customApiUrl: string;
    customApiKey: string;
    model: string;
}

const ApiSettings: React.FC<ApiSettingsProps> = ({ isExpanded, onToggle }) => {
    const [config, setConfig] = useState<ApiConfig>(() => {
        // Загружаем настройки из localStorage
        const saved = localStorage.getItem('shotgun_api_config');
        return saved ? JSON.parse(saved) : {
            provider: 'gemini',
            openaiApiKey: '',
            geminiApiKey: '',
            openrouterApiKey: '',
            customApiUrl: '',
            customApiKey: '',
            model: 'gpt-4'
        };
    });

    // Сохраняем настройки в localStorage при изменении
    useEffect(() => {
        localStorage.setItem('shotgun_api_config', JSON.stringify(config));
    }, [config]);

    const updateConfig = (updates: Partial<ApiConfig>) => {
        setConfig(prev => ({ ...prev, ...updates }));
    };

    const getProviderIcon = (provider: ApiProvider) => {
        switch (provider) {
            case 'openai':
                return <Globe size={16} />;
            case 'gemini':
                return <Globe size={16} />;
            case 'openrouter':
                return <Database size={16} />;
            case 'custom':
                return <Database size={16} />;
            default:
                return <Globe size={16} />;
        }
    };

    const getProviderName = (provider: ApiProvider) => {
        switch (provider) {
            case 'openai':
                return 'OpenAI API';
            case 'gemini':
                return 'Google Gemini';
            case 'openrouter':
                return 'OpenRouter';
            case 'custom':
                return 'Кастомный сервер';
            default:
                return 'Unknown';
        }
    };

    const getModelPlaceholder = (provider: ApiProvider) => {
        switch (provider) {
            case 'openai':
                return 'gpt-4, gpt-3.5-turbo';
            case 'gemini':
                return 'gemini-pro, gemini-pro-vision';
            case 'openrouter':
                return 'anthropic/claude-3-opus, meta-llama/llama-2-70b-chat';
            case 'custom':
                return 'Название модели';
            default:
                return '';
        }
    };

    return (
        <div className="api-settings">
            <div className="api-settings-header" onClick={onToggle}>
                <div className="header-content">
                    <Gear size={16} />
                    <span>Настройки API</span>
                    <div className="provider-info">
                        {getProviderIcon(config.provider)}
                        <span>{getProviderName(config.provider)}</span>
                    </div>
                </div>
                <CaretDown 
                    size={16} 
                    className={`chevron ${isExpanded ? 'expanded' : ''}`}
                />
            </div>
            
            {isExpanded && (
                <div className="api-settings-content">
                    <div className="setting-group">
                        <label>API Провайдер:</label>
                        <select 
                            value={config.provider}
                            onChange={(e) => updateConfig({ provider: e.target.value as ApiProvider })}
                        >
                            <option value="gemini">Google Gemini</option>
                            <option value="openai">OpenAI</option>
                            <option value="openrouter">OpenRouter</option>
                            <option value="custom">Кастомный сервер</option>
                        </select>
                    </div>

                    {config.provider === 'openai' && (
                        <div className="setting-group">
                            <label>
                                <Key size={14} />
                                OpenAI API Ключ:
                            </label>
                            <input
                                type="password"
                                value={config.openaiApiKey}
                                onChange={(e) => updateConfig({ openaiApiKey: e.target.value })}
                                placeholder="sk-..."
                            />
                        </div>
                    )}

                    {config.provider === 'gemini' && (
                        <div className="setting-group">
                            <label>
                                <Key size={14} />
                                Gemini API Ключ:
                            </label>
                            <input
                                type="password"
                                value={config.geminiApiKey}
                                onChange={(e) => updateConfig({ geminiApiKey: e.target.value })}
                                placeholder="AI..."
                            />
                        </div>
                    )}

                    {config.provider === 'openrouter' && (
                        <div className="setting-group">
                            <label>
                                <Key size={14} />
                                OpenRouter API Ключ:
                            </label>
                            <input
                                type="password"
                                value={config.openrouterApiKey}
                                onChange={(e) => updateConfig({ openrouterApiKey: e.target.value })}
                                placeholder="sk-or-..."
                            />
                        </div>
                    )}

                    {config.provider === 'custom' && (
                        <>
                            <div className="setting-group">
                                                             <label>
                                 <Database size={14} />
                                 URL Сервера:
                             </label>
                                <input
                                    type="text"
                                    value={config.customApiUrl}
                                    onChange={(e) => updateConfig({ customApiUrl: e.target.value })}
                                    placeholder="https://api.example.com/v1"
                                />
                            </div>
                            <div className="setting-group">
                                <label>
                                    <Key size={14} />
                                    API Ключ:
                                </label>
                                <input
                                    type="password"
                                    value={config.customApiKey}
                                    onChange={(e) => updateConfig({ customApiKey: e.target.value })}
                                    placeholder="Ваш API ключ"
                                />
                            </div>
                        </>
                    )}

                    <div className="setting-group">
                        <label>Модель:</label>
                        <input
                            type="text"
                            value={config.model}
                            onChange={(e) => updateConfig({ model: e.target.value })}
                            placeholder={getModelPlaceholder(config.provider)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApiSettings; 