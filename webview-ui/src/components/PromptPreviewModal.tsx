import React from 'react';
import { observer } from 'mobx-react-lite';
import { X, Copy, Eye } from 'phosphor-react';
import { usePromptStore, useFileStore, useTemplateStore } from '../contexts/StoreContext';

export const PromptPreviewModal: React.FC = observer(() => {
    const promptStore = usePromptStore();
    const fileStore = useFileStore();
    const templateStore = useTemplateStore();

    if (!promptStore.isPreviewModalOpen) return null;

    const handleClose = () => {
        promptStore.setPreviewModalOpen(false);
    };

    const handleCopyUserPrompt = async () => {
        try {
            await navigator.clipboard.writeText(promptStore.currentPrompt);
        } catch (error) {
            console.error('Ошибка копирования пользовательского промпта:', error);
        }
    };

    const handleCopyFinalPrompt = async () => {
        try {
            await navigator.clipboard.writeText(finalUserPrompt);
        } catch (error) {
            console.error('Ошибка копирования итогового промпта:', error);
        }
    };

    const handleCopySystemPrompt = async () => {
        if (templateStore.selectedTemplate?.systemPrompt) {
            try {
                await navigator.clipboard.writeText(templateStore.selectedTemplate.systemPrompt);
            } catch (error) {
                console.error('Ошибка копирования системного промпта:', error);
            }
        }
    };

    const selectedFilesText = fileStore.selectedFilesList.length > 0 
        ? fileStore.selectedFilesList.map(file => 
            `// Файл: ${file.path}\n${file.content || '[Содержимое не загружено]'}`
          ).join('\n\n---\n\n')
        : 'Файлы не выбраны';

    const template = templateStore.selectedTemplate;
    let finalUserPrompt = promptStore.currentPrompt;

    // Если используется шаблон, подставляем значения
    if (template && template.userPrompt) {
        finalUserPrompt = template.userPrompt
            .replace(/\{\{ЗАДАЧА\}\}/g, promptStore.currentPrompt)
            .replace(/\{\{FILES\}\}/g, selectedFilesText);
    }

    return (
        <div className="modal-overlay">
            <div className="modal modal--large">
                <div className="modal__header">
                    <h3 className="modal__title">
                        <Eye size={20} />
                        Предпросмотр промпта
                    </h3>
                    <button 
                        className="modal__close"
                        onClick={handleClose}
                        aria-label="Закрыть"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="modal__content">
                    {/* Информация о шаблоне */}
                    {template && (
                        <div className="prompt-preview__section">
                            <div className="prompt-preview__section-header">
                                <h4 className="prompt-preview__section-title">Используемый шаблон</h4>
                            </div>
                            <div className="prompt-preview__template-info">
                                <strong>{template.name}</strong>
                                {template.description && (
                                    <p className="prompt-preview__template-description">
                                        {template.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Системный промпт */}
                    {template?.systemPrompt && (
                        <div className="prompt-preview__section">
                            <div className="prompt-preview__section-header">
                                <h4 className="prompt-preview__section-title">Системный промпт</h4>
                                <button
                                    className="btn btn--secondary btn--small"
                                    onClick={handleCopySystemPrompt}
                                    title="Копировать системный промпт"
                                >
                                    <Copy size={14} />
                                    Копировать
                                </button>
                            </div>
                            <pre className="prompt-preview__content">
                                {template.systemPrompt}
                            </pre>
                        </div>
                    )}

                    {/* Исходный пользовательский запрос */}
                    <div className="prompt-preview__section">
                        <div className="prompt-preview__section-header">
                            <h4 className="prompt-preview__section-title">Ваш запрос</h4>
                        </div>
                        <pre className="prompt-preview__content prompt-preview__content--user">
                            {promptStore.currentPrompt || 'Запрос не введен'}
                        </pre>
                    </div>

                    {/* Выбранные файлы */}
                    <div className="prompt-preview__section">
                        <div className="prompt-preview__section-header">
                            <h4 className="prompt-preview__section-title">
                                Выбранные файлы ({fileStore.selectedFilesList.length})
                            </h4>
                        </div>
                        <div className="prompt-preview__files">
                            {fileStore.selectedFilesList.length > 0 ? (
                                <ul className="prompt-preview__files-list">
                                    {fileStore.selectedFilesList.map(file => (
                                        <li key={file.path} className="prompt-preview__file-item">
                                            <span className="prompt-preview__file-path">{file.path}</span>
                                            <span className="prompt-preview__file-size">
                                                {file.content ? `${file.content.length} символов` : 'Не загружен'}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="prompt-preview__empty">Файлы не выбраны</p>
                            )}
                        </div>
                    </div>

                    {/* Итоговый промпт */}
                    <div className="prompt-preview__section">
                        <div className="prompt-preview__section-header">
                            <h4 className="prompt-preview__section-title">
                                Итоговый промпт для AI
                                {template && (
                                    <span className="prompt-preview__note">
                                        (с подставленными данными)
                                    </span>
                                )}
                            </h4>
                            <button
                                className="btn btn--secondary btn--small"
                                onClick={handleCopyFinalPrompt}
                                title="Копировать итоговый промпт"
                            >
                                <Copy size={14} />
                                Копировать
                            </button>
                        </div>
                        <pre className="prompt-preview__content prompt-preview__content--final">
                            {finalUserPrompt}
                        </pre>
                    </div>
                </div>

                <div className="modal__footer">
                    <button 
                        className="btn btn--secondary"
                        onClick={handleClose}
                    >
                        Закрыть
                    </button>
                </div>
            </div>
        </div>
    );
}); 