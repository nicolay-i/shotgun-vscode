import React from 'react';
import { observer } from 'mobx-react-lite';
import { usePromptStore, useFileStore, useApiStore, useAppStore, useTemplateStore } from '../contexts/StoreContext';
import { PaperPlaneRight, Trash, Eye } from 'phosphor-react';

export const PromptSection: React.FC = observer(() => {
    const promptStore = usePromptStore();
    const fileStore = useFileStore();
    const apiStore = useApiStore();
    const appStore = useAppStore();
    const templateStore = useTemplateStore();

    const canSubmit = promptStore.currentPrompt.trim().length > 0 && 
                     fileStore.selectedFilesList.length > 0 && 
                     !promptStore.isSubmitting &&
                     apiStore.isConfigValid;

    const handleSubmit = async () => {
        if (!canSubmit) return;

        try {
            appStore.setLoading(true);
            promptStore.setSubmitting(true);

            // Отправляем запрос к AI с текущим шаблоном
            // Преобразуем observable объекты в plain objects для postMessage
            appStore.sendMessage({
                type: 'submitToAI',
                data: {
                    prompt: promptStore.currentPrompt,
                    selectedFiles: fileStore.selectedFilesList.map(file => ({
                        path: file.path,
                        content: file.content || ''
                    })),
                    apiConfig: {
                        provider: apiStore.currentApiConfig.provider,
                        apiKey: apiStore.currentApiConfig.apiKey,
                        customUrl: apiStore.currentApiConfig.customUrl,
                        model: apiStore.currentApiConfig.model
                    },
                    template: templateStore.selectedTemplate ? {
                        id: templateStore.selectedTemplate.id,
                        name: templateStore.selectedTemplate.name,
                        description: templateStore.selectedTemplate.description,
                        systemPrompt: templateStore.selectedTemplate.systemPrompt,
                        userPrompt: templateStore.selectedTemplate.userPrompt,
                        isBuiltIn: templateStore.selectedTemplate.isBuiltIn
                    } : undefined
                }
            });
        } catch (error) {
            console.error('Ошибка отправки запроса:', error);
            appStore.setError('Ошибка отправки запроса к AI');
            appStore.setLoading(false);
            promptStore.setSubmitting(false);
        }
    };

    const handleClear = () => {
        promptStore.setCurrentPrompt('');
        fileStore.clearSelection();
        promptStore.setAiResponse('');
    };

    const handlePreview = () => {
        promptStore.setPreviewModalOpen(true);
    };

    return (
        <div className="prompt-section">
            <h3 className="app__section-title">Ваш запрос</h3>
            <div className="prompt-section__content">
                <textarea 
                    className="prompt-section__textarea"
                    placeholder="Введите ваш запрос или задачу для AI..."
                    value={promptStore.currentPrompt}
                    onChange={(e) => promptStore.setCurrentPrompt(e.target.value)}
                    rows={4}
                />
                <div className="prompt-section__actions">
                    <button
                        className="btn btn--secondary"
                        onClick={handleClear}
                        title="Очистить форму"
                    >
                        <Trash size={16} />
                        Очистить
                    </button>
                    <button
                        className="btn btn--secondary"
                        onClick={handlePreview}
                        title="Предпросмотр промпта"
                        disabled={!promptStore.currentPrompt.trim()}
                    >
                        <Eye size={16} />
                        Предпросмотр
                    </button>
                    <button
                        className={`btn btn--primary ${!canSubmit ? 'btn--disabled' : ''}`}
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        title={
                            !promptStore.currentPrompt.trim() ? 'Введите запрос' :
                            !fileStore.selectedFilesList.length ? 'Выберите файлы' :
                            !apiStore.isConfigValid ? 'Настройте API' :
                            'Отправить запрос к AI'
                        }
                    >
                        <PaperPlaneRight size={16} />
                        {promptStore.isSubmitting ? 'Отправка...' : 'Отправить'}
                    </button>
                </div>
            </div>
        </div>
    );
}); 