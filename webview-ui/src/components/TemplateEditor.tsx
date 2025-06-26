import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { X, FloppyDisk } from 'phosphor-react';
import { PromptTemplate } from '../stores/TemplateStore';

interface TemplateEditorProps {
    isOpen: boolean;
    template?: PromptTemplate | null;
    onSave: (template: PromptTemplate) => void;
    onClose: () => void;
}

export const TemplateEditor: React.FC<TemplateEditorProps> = observer(({ 
    isOpen, 
    template, 
    onSave, 
    onClose 
}) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        systemPrompt: '',
        userPrompt: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (template) {
            setFormData({
                name: template.name,
                description: template.description,
                systemPrompt: template.systemPrompt,
                userPrompt: template.userPrompt
            });
        } else {
            setFormData({
                name: '',
                description: '',
                systemPrompt: '',
                userPrompt: ''
            });
        }
        setErrors({});
    }, [template, isOpen]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Название шаблона обязательно';
        }

        if (!formData.systemPrompt.trim()) {
            newErrors.systemPrompt = 'Системный промпт обязателен';
        }

        if (!formData.userPrompt.trim()) {
            newErrors.userPrompt = 'Пользовательский промпт обязателен';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validateForm()) return;

        const newTemplate: PromptTemplate = {
            id: template?.id || `template-${Date.now()}`,
            name: formData.name.trim(),
            description: formData.description.trim(),
            systemPrompt: formData.systemPrompt.trim(),
            userPrompt: formData.userPrompt.trim(),
            isBuiltIn: false
        };

        onSave(newTemplate);
        onClose();
    };

    const handleFieldChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal">
                <div className="modal__header">
                    <h3 className="modal__title">
                        {template ? 'Редактировать шаблон' : 'Новый шаблон'}
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
                    <div className="form-group">
                        <label className="form-group__label" htmlFor="template-name">
                            Название шаблона *
                        </label>
                        <input
                            id="template-name"
                            type="text"
                            className={`form-group__input ${errors.name ? 'form-group__input--error' : ''}`}
                            value={formData.name}
                            onChange={(e) => handleFieldChange('name', e.target.value)}
                            placeholder="Название шаблона"
                        />
                        {errors.name && <span className="form-group__error">{errors.name}</span>}
                    </div>

                    <div className="form-group">
                        <label className="form-group__label" htmlFor="template-description">
                            Описание
                        </label>
                        <input
                            id="template-description"
                            type="text"
                            className="form-group__input"
                            value={formData.description}
                            onChange={(e) => handleFieldChange('description', e.target.value)}
                            placeholder="Краткое описание шаблона"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-group__label" htmlFor="template-system">
                            Системный промпт *
                        </label>
                        <textarea
                            id="template-system"
                            className={`form-group__input form-group__input--textarea ${errors.systemPrompt ? 'form-group__input--error' : ''}`}
                            value={formData.systemPrompt}
                            onChange={(e) => handleFieldChange('systemPrompt', e.target.value)}
                            placeholder="Определите роль и поведение AI..."
                            rows={4}
                        />
                        {errors.systemPrompt && <span className="form-group__error">{errors.systemPrompt}</span>}
                    </div>

                    <div className="form-group">
                        <label className="form-group__label" htmlFor="template-user">
                            Пользовательский промпт *
                        </label>
                        <textarea
                            id="template-user"
                            className={`form-group__input form-group__input--textarea ${errors.userPrompt ? 'form-group__input--error' : ''}`}
                            value={formData.userPrompt}
                            onChange={(e) => handleFieldChange('userPrompt', e.target.value)}
                            placeholder="Используйте {{ЗАДАЧА}} и {{FILES}} для подстановки..."
                            rows={6}
                        />
                        {errors.userPrompt && <span className="form-group__error">{errors.userPrompt}</span>}
                        <div className="form-group__help">
                            Доступные плейсхолдеры: <code>{'{{ЗАДАЧА}}'}</code> и <code>{'{{FILES}}'}</code>
                        </div>
                    </div>
                </div>

                <div className="modal__footer">
                    <button 
                        className="btn btn--secondary"
                        onClick={onClose}
                    >
                        Отмена
                    </button>
                    <button 
                        className="btn btn--primary"
                        onClick={handleSave}
                    >
                        <FloppyDisk size={16} />
                        {template ? 'Сохранить' : 'Создать'}
                    </button>
                </div>
            </div>
        </div>
    );
}); 