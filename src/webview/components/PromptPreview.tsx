import React, { useState, useEffect } from 'react';
import { PromptTemplate } from '../../types/ApiTypes';
import { processTemplate } from '../utils/templateUtils';

interface PromptPreviewProps {
    template: PromptTemplate | null;
    isOpen: boolean;
    onClose: () => void;
    onUseTemplate: (template: PromptTemplate) => void;
    userInput: string;
    filesContent: string;
}

const PromptPreview: React.FC<PromptPreviewProps> = ({
    template,
    isOpen,
    onClose,
    onUseTemplate,
    userInput,
    filesContent
}) => {
    const [sampleUserInput, setSampleUserInput] = useState<string>('');
    const [processedPrompt, setProcessedPrompt] = useState<string>('');

    useEffect(() => {
        if (template && isOpen) {
            // Используем переданный пользовательский ввод или образец
            const inputToUse = userInput || sampleUserInput || '[Пример задачи]';
            const processedResult = processTemplate(template, inputToUse, filesContent);
            setProcessedPrompt(processedResult);
        }
    }, [template, isOpen, userInput, filesContent, sampleUserInput]);

    useEffect(() => {
        if (isOpen) {
            setSampleUserInput(userInput || '');
        }
    }, [isOpen, userInput]);

    const handleClose = () => {
        onClose();
    };

    const handleUseTemplate = () => {
        if (template) {
            onUseTemplate(template);
        }
        onClose();
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(processedPrompt).then(() => {
            // Можно добавить уведомление об успешном копировании
        });
    };

    if (!isOpen || !template) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content prompt-preview" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>👁️ Предпросмотр шаблона</h3>
                    <button className="btn-close" onClick={handleClose}>
                        ✕
                    </button>
                </div>

                <div className="preview-content">
                    <div className="template-info">
                        <h4>🏷️ {template.name}</h4>
                        <p className="template-description">{template.description}</p>
                    </div>

                    <div className="preview-section">
                        <h4>📝 Тестовый ввод</h4>
                        <textarea
                            value={sampleUserInput}
                            onChange={(e) => setSampleUserInput(e.target.value)}
                            placeholder="Введите пример задачи для тестирования шаблона..."
                            rows={3}
                            className="sample-input"
                        />
                    </div>

                    <div className="preview-section">
                        <h4>🤖 Системный промпт</h4>
                        <div className="prompt-block system-prompt">
                            {template.systemPrompt}
                        </div>
                    </div>

                    <div className="preview-section">
                        <h4>💬 Пользовательский промпт</h4>
                        <div className="prompt-block user-prompt">
                            {template.userPrompt}
                        </div>
                    </div>

                    <div className="preview-section">
                        <div className="section-header">
                            <h4>🎯 Итоговый промпт для AI</h4>
                            <button 
                                className="btn-icon"
                                onClick={copyToClipboard}
                                title="Скопировать в буфер обмена"
                            >
                                📋
                            </button>
                        </div>
                        <div className="prompt-block final-prompt">
                            {processedPrompt}
                        </div>
                    </div>

                    <div className="variables-info">
                        <h4>🔄 Замененные переменные:</h4>
                        <div className="variables-list">
                            <div className="variable-item">
                                <code>&#x7B;&#x7B;ЗАДАЧА&#x7D;&#x7D;</code>
                                <span className="arrow">→</span>
                                <span className="value">{sampleUserInput || '[Пример задачи]'}</span>
                            </div>
                            <div className="variable-item">
                                <code>&#x7B;&#x7B;FILES&#x7D;&#x7D;</code>
                                <span className="arrow">→</span>
                                <span className="value">{filesContent || '[Файлы не выбраны]'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal-actions">
                    <button 
                        type="button" 
                        className="btn-secondary"
                        onClick={handleClose}
                    >
                        Закрыть
                    </button>
                    <button 
                        type="button" 
                        className="btn-primary"
                        onClick={handleUseTemplate}
                    >
                        🚀 Использовать шаблон
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PromptPreview; 