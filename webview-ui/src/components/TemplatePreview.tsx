import React from 'react';
import { observer } from 'mobx-react-lite';
import { X, PaperPlaneRight } from 'phosphor-react';
import { PromptTemplate } from '../stores/TemplateStore';
import { usePromptStore, useFileStore } from '../contexts/StoreContext';

interface TemplatePreviewProps {
    isOpen: boolean;
    template?: PromptTemplate | null;
    onClose: () => void;
    onUse: () => void;
}

export const TemplatePreview: React.FC<TemplatePreviewProps> = observer(({ 
    isOpen, 
    template, 
    onClose, 
    onUse 
}) => {
    const promptStore = usePromptStore();
    const fileStore = useFileStore();

    if (!isOpen || !template) return null;

    // Подставляем плейсхолдеры
    const currentTask = promptStore.currentPrompt || '[Ваш запрос будет здесь]';
    const selectedFilesContent = fileStore.selectedFilesList.length > 0 
        ? fileStore.selectedFilesList.map(f => `// ${f.path}\n[Содержимое файла]`).join('\n\n')
        : '[Выбранные файлы будут здесь]';
    
    const processedUserPrompt = template.userPrompt
        .replace(/\{\{ЗАДАЧА\}\}/g, currentTask)
        .replace(/\{\{FILES\}\}/g, selectedFilesContent);

    return (
        <div className="modal-overlay">
            <div className="modal modal--large">
                <div className="modal__header">
                    <h3 className="modal__title">
                        Предпросмотр: {template.name}
                    </h3>
                    <button 
                        className="modal__close"
                        onClick={onClose}
                        aria-label="Закрыть"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="modal__content">
                    {template.description && (
                        <div className="template-preview__description">
                            <p>{template.description}</p>
                        </div>
                    )}

                    <div className="template-preview__section">
                        <h4 className="template-preview__section-title">Системный промпт</h4>
                        <pre className="template-preview__content">
                            {template.systemPrompt}
                        </pre>
                    </div>

                    <div className="template-preview__section">
                        <h4 className="template-preview__section-title">Пользовательский промпт (шаблон)</h4>
                        <pre className="template-preview__content template-preview__content--template">
                            {template.userPrompt}
                        </pre>
                    </div>

                    <div className="template-preview__section">
                        <h4 className="template-preview__section-title">
                            Итоговый пользовательский промпт
                            <span className="template-preview__note">
                                (с подставленными данными)
                            </span>
                        </h4>
                        <pre className="template-preview__content template-preview__content--processed">
                            {processedUserPrompt}
                        </pre>
                    </div>
                </div>

                <div className="modal__footer">
                    <button 
                        className="btn btn--secondary"
                        onClick={onClose}
                    >
                        Закрыть
                    </button>
                    <button 
                        className="btn btn--primary"
                        onClick={onUse}
                    >
                        <PaperPlaneRight size={16} />
                        Использовать шаблон
                    </button>
                </div>
            </div>
        </div>
    );
}); 