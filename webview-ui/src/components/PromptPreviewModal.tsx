import React from 'react';
import { observer } from 'mobx-react-lite';
import { X, Copy, Eye, Code, CaretDown, CaretUp } from 'phosphor-react';
import { usePromptStore, useFileStore, useTemplateStore, useApiStore } from '../contexts/StoreContext';

export const PromptPreviewModal: React.FC = observer(() => {
    const promptStore = usePromptStore();
    const fileStore = useFileStore();
    const templateStore = useTemplateStore();
    const apiStore = useApiStore();
    
    const [showAllFiles, setShowAllFiles] = React.useState(false);

    if (!promptStore.isPreviewModalOpen) return null;

    const handleClose = () => {
        promptStore.setPreviewModalOpen(false);
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



    const template = templateStore.selectedTemplate;
    const currentProvider = apiStore.currentApiConfig.provider;
    
    // Используем данные с сервера, если они доступны
    const previewData = promptStore.payloadPreviewData;
    const systemPrompt = previewData?.systemPrompt || 'Данные загружаются...';
    const finalUserPrompt = previewData?.userPrompt || 'Данные загружаются...';

    // Логика для отображения файлов
    const selectedFiles = fileStore.selectedFilesList;
    const displayedFiles = showAllFiles ? selectedFiles : selectedFiles.slice(0, 5);
    const hasMoreFiles = selectedFiles.length > 5;

    return (
        <div className="modal-overlay">
            <div className="modal modal--large">
                <div className="modal__header">
                    <h3 className="modal__title">
                        <Eye size={20} />
                        Предпросмотр запроса к LLM
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

                    {/* Информация о провайдере */}
                    <div className="prompt-preview__section">
                        <div className="prompt-preview__section-header">
                            <h4 className="prompt-preview__section-title">Провайдер и модель</h4>
                        </div>
                        <div className="prompt-preview__provider-info">
                            <p><strong>Провайдер:</strong> {currentProvider}</p>
                            <p><strong>Модель:</strong> {apiStore.currentApiConfig.model || 'По умолчанию'}</p>
                            {apiStore.currentApiConfig.customUrl && (
                                <p><strong>URL:</strong> {apiStore.currentApiConfig.customUrl}</p>
                            )}
                        </div>
                    </div>

                    {/* Системный промпт */}
                    {systemPrompt && (
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
                                {systemPrompt}
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
                                <div className="prompt-preview__files-content">
                                    <ul className="prompt-preview__files-list">
                                        {displayedFiles.map(file => (
                                            <li key={file.path} className="prompt-preview__file-item">
                                                <span className="prompt-preview__file-path">{file.path}</span>
                                                <span className="prompt-preview__file-size">
                                                    {file.content ? `${file.content.length} символов` : 'Не загружен'}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                    {hasMoreFiles && (
                                        <button
                                            className="btn btn--secondary btn--small prompt-preview__toggle-files"
                                            onClick={() => setShowAllFiles(!showAllFiles)}
                                        >
                                            {showAllFiles ? (
                                                <>
                                                    <CaretUp size={14} />
                                                    Свернуть список
                                                </>
                                            ) : (
                                                <>
                                                    <CaretDown size={14} />
                                                    Показать все ({selectedFiles.length - 5} ещё)
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
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