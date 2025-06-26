import React from 'react';
import { observer } from 'mobx-react-lite';
import { usePromptStore, useAppStore } from '../contexts/StoreContext';
import { FloppyDisk, Copy } from 'phosphor-react';

export const ResponseSection: React.FC = observer(() => {
    const promptStore = usePromptStore();
    const appStore = useAppStore();

    const handleSaveResponse = () => {
        if (promptStore.aiResponse) {
            appStore.sendMessage({
                type: 'saveResponse',
                data: {
                    content: promptStore.aiResponse
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
                        title="Сохранить ответ в файл"
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
            </div>
        </div>
    );
}); 