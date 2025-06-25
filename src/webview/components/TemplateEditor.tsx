import React, { useState, useEffect } from 'react';
import { PromptTemplate, TemplateCategory } from '../../types/ApiTypes';
import { 
    generateTemplateId, 
    validateTemplate, 
    getCategoryIcon, 
    getCategoryName 
} from '../utils/templateUtils';

interface TemplateEditorProps {
    template: PromptTemplate | null; // null для создания нового
    isOpen: boolean;
    onClose: () => void;
    onSave: (template: PromptTemplate) => void;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({ 
    template, 
    isOpen, 
    onClose, 
    onSave 
}) => {
    const [formData, setFormData] = useState<Partial<PromptTemplate>>({
        name: '',
        description: '',
        systemPrompt: '',
        userPrompt: '',
        category: 'custom'
    });
    const [errors, setErrors] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (template) {
            // Редактирование существующего шаблона
            setFormData({
                name: template.name,
                description: template.description,
                systemPrompt: template.systemPrompt,
                userPrompt: template.userPrompt,
                category: template.category
            });
        } else {
            // Создание нового шаблона
            setFormData({
                name: '',
                description: '',
                systemPrompt: '',
                userPrompt: '',
                category: 'custom'
            });
        }
        setErrors([]);
    }, [template, isOpen]);

    const handleChange = (field: keyof PromptTemplate, value: string | TemplateCategory) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Очищаем ошибки при изменении полей
        if (errors.length > 0) {
            setErrors([]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const validationErrors = validateTemplate(formData);
        if (validationErrors.length > 0) {
            setErrors(validationErrors);
            setIsSubmitting(false);
            return;
        }

        const now = new Date();
        const templateToSave: PromptTemplate = {
            id: template?.id || generateTemplateId(),
            name: formData.name!,
            description: formData.description!,
            systemPrompt: formData.systemPrompt!,
            userPrompt: formData.userPrompt!,
            category: formData.category!,
            isBuiltIn: template?.isBuiltIn || false,
            createdAt: template?.createdAt || now,
            updatedAt: now
        };

        onSave(templateToSave);
        setIsSubmitting(false);
        onClose();
    };

    const handleClose = () => {
        if (!isSubmitting) {
            onClose();
        }
    };

    if (!isOpen) return null;

    const categories: TemplateCategory[] = ['code-editing', 'improvement-plan', 'refactoring-plan', 'custom'];

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content template-editor" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>
                        {template ? '✏️ Редактирование шаблона' : '➕ Создание нового шаблона'}
                    </h3>
                    <button 
                        className="btn-close" 
                        onClick={handleClose}
                        disabled={isSubmitting}
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="template-form">
                    {errors.length > 0 && (
                        <div className="error-messages">
                            {errors.map((error, index) => (
                                <div key={index} className="error-message">
                                    ⚠️ {error}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="template-name">
                                Название шаблона *
                            </label>
                            <input
                                id="template-name"
                                type="text"
                                value={formData.name || ''}
                                onChange={(e) => handleChange('name', e.target.value)}
                                placeholder="Введите название шаблона"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="template-category">
                                Категория *
                            </label>
                            <select
                                id="template-category"
                                value={formData.category || 'custom'}
                                onChange={(e) => handleChange('category', e.target.value as TemplateCategory)}
                                disabled={isSubmitting}
                            >
                                {categories.map(category => (
                                    <option key={category} value={category}>
                                        {getCategoryIcon(category)} {getCategoryName(category)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="template-description">
                            Описание
                        </label>
                        <textarea
                            id="template-description"
                            value={formData.description || ''}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="Краткое описание назначения шаблона"
                            rows={2}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="system-prompt">
                            Системный промпт *
                            <span className="field-hint">
                                Определяет роль и поведение AI
                            </span>
                        </label>
                        <textarea
                            id="system-prompt"
                            value={formData.systemPrompt || ''}
                            onChange={(e) => handleChange('systemPrompt', e.target.value)}
                            placeholder="Например: Ты опытный разработчик. Анализируй код и предлагай улучшения..."
                            rows={6}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="user-prompt">
                            Пользовательский промпт *
                            <span className="field-hint">
                                Шаблон запроса с переменными &#x7B;&#x7B;ЗАДАЧА&#x7D;&#x7D; и &#x7B;&#x7B;FILES&#x7D;&#x7D;
                            </span>
                        </label>
                        <textarea
                            id="user-prompt"
                            value={formData.userPrompt || ''}
                            onChange={(e) => handleChange('userPrompt', e.target.value)}
                            placeholder="Пример: Проанализируй код и выполни: {{ЗАДАЧА}}&#10;&#10;Файлы:&#10;{{FILES}}"
                            rows={8}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="template-variables-help">
                        <h4>📝 Доступные переменные:</h4>
                        <ul>
                            <li><code>&#x7B;&#x7B;ЗАДАЧА&#x7D;&#x7D;</code> - будет заменена на текст, введенный пользователем</li>
                            <li><code>&#x7B;&#x7B;FILES&#x7D;&#x7D;</code> - будет заменена на содержимое выбранных файлов</li>
                        </ul>
                    </div>

                    <div className="modal-actions">
                        <button 
                            type="button" 
                            className="btn-secondary"
                            onClick={handleClose}
                            disabled={isSubmitting}
                        >
                            Отмена
                        </button>
                        <button 
                            type="submit" 
                            className="btn-primary"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Сохранение...' : (template ? 'Сохранить изменения' : 'Создать шаблон')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TemplateEditor; 