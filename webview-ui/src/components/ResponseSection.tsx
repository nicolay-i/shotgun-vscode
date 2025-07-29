import React from 'react';
import { observer } from 'mobx-react-lite';
import { usePromptStore, useAppStore, useTemplateStore } from '../contexts/StoreContext';
import { FloppyDisk, Copy } from 'phosphor-react';
import './ResponseSection.scss';

export const ResponseSection: React.FC = observer(() => {
    const promptStore = usePromptStore();
    const appStore = useAppStore();
    const templateStore = useTemplateStore();

    const handleSaveResponse = () => {
        if (promptStore.aiResponse) {
            appStore.sendMessage({
                type: 'saveResponse',
                data: {
                    content: promptStore.aiResponse,
                    templateName: templateStore.selectedTemplate?.name
                }
            });
        }
    };

    const handleCopyResponse = async () => {
        if (promptStore.aiResponse) {
            try {
                await navigator.clipboard.writeText(promptStore.aiResponse);
                // Можно показать уведомление об успешном копировании
            } catch (error) {
                console.error('Ошибка копирования:', error);
            }
        }
    };

    const formatNumber = (num: number): string => {
        return num.toLocaleString('ru-RU');
    };

    const formatCurrency = (amount: number, currency: string): string => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 4,
            maximumFractionDigits: 4
        }).format(amount);
    };

    if (!promptStore.hasResponse) {
        return (
            <div className="response-section">
                <h3 className="app__section-title">Ответ AI</h3>
                <div className="response-section__empty">
                    <p className="text-small">Ответ от AI появится здесь после отправки запроса</p>
                </div>
            </div>
        );
    }

    return (
        <div className="response-section">
            <div className="response-section__header">
                <h3 className="app__section-title">Ответ AI</h3>
                <div className="response-section__actions">
                    <button
                        className="btn btn--secondary btn--small"
                        onClick={handleCopyResponse}
                        title="Копировать ответ"
                    >
                        <Copy size={14} />
                        Копировать
                    </button>
                    <button
                        className="btn btn--secondary btn--small"
                        onClick={handleSaveResponse}
                        title="Сохранить ответ в папку plans"
                    >
                        <FloppyDisk size={14} />
                        Сохранить
                    </button>
                </div>
            </div>
            <div className="response-section__content">
                <pre className="response-section__text">
                    {promptStore.aiResponse}
                </pre>
                
                {promptStore.hasTokenInfo && (
                    <div className="response-section__token-info">
                        <div className="response-section__token-row">
                            <span className="response-section__token-label">Токены входа:</span>
                            <span className="response-section__token-value">
                                {formatNumber(promptStore.tokenUsage!.prompt_tokens)}
                            </span>
                        </div>
                        <div className="response-section__token-row">
                            <span className="response-section__token-label">Токены выхода:</span>
                            <span className="response-section__token-value">
                                {formatNumber(promptStore.tokenUsage!.completion_tokens)}
                            </span>
                        </div>
                        <div className="response-section__token-row">
                            <span className="response-section__token-label">Итого токенов:</span>
                            <span className="response-section__token-value">
                                {formatNumber(promptStore.tokenUsage!.total_tokens)}
                            </span>
                        </div>
                        <div className="response-section__token-row">
                            <span className="response-section__token-label">Стоимость входа:</span>
                            <span className="response-section__token-value">
                                {formatCurrency(promptStore.costInfo!.promptCost, promptStore.costInfo!.currency)}
                            </span>
                        </div>
                        <div className="response-section__token-row">
                            <span className="response-section__token-label">Стоимость выхода:</span>
                            <span className="response-section__token-value">
                                {formatCurrency(promptStore.costInfo!.completionCost, promptStore.costInfo!.currency)}
                            </span>
                        </div>
                        <div className="response-section__token-row">
                            <span className="response-section__token-label">Общая стоимость:</span>
                            <span className={`response-section__token-value response-section__cost-highlight`}>
                                {formatCurrency(promptStore.costInfo!.totalCost, promptStore.costInfo!.currency)}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});