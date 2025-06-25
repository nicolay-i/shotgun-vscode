import React, { useState, useEffect } from 'react';
import { PromptTemplate, TemplateCategory } from '../../types/ApiTypes';
import { 
    loadTemplates, 
    getCategoryIcon, 
    getCategoryName,
    saveCustomTemplates
} from '../utils/templateUtils';

interface TemplateManagerProps {
    selectedTemplate: PromptTemplate | null;
    onTemplateSelect: (template: PromptTemplate | null) => void;
    onTemplateEdit: (template: PromptTemplate | null) => void;
    onTemplatePreview: (template: PromptTemplate) => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({
    selectedTemplate,
    onTemplateSelect,
    onTemplateEdit,
    onTemplatePreview
}) => {
    const [templates, setTemplates] = useState<PromptTemplate[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
    const [expandedCategories, setExpandedCategories] = useState<Set<TemplateCategory | 'all'>>(new Set(['all']));

    useEffect(() => {
        loadTemplatesData();
    }, []);

    const loadTemplatesData = () => {
        const loadedTemplates = loadTemplates();
        setTemplates(loadedTemplates);
    };

    const handleDeleteTemplate = (templateId: string) => {
        if (window.confirm('Вы уверены, что хотите удалить этот шаблон?')) {
            const updatedTemplates = templates.filter(t => t.id !== templateId);
            setTemplates(updatedTemplates);
            saveCustomTemplates(updatedTemplates);
            
            // Если удаляемый шаблон был выбран, снимаем выбор
            if (selectedTemplate?.id === templateId) {
                onTemplateSelect(null);
            }
        }
    };

    const filteredTemplates = selectedCategory === 'all' 
        ? templates 
        : templates.filter(t => t.category === selectedCategory);

    const categories = ['all', 'code-editing', 'improvement-plan', 'refactoring-plan', 'custom'] as const;

    const groupedTemplates = categories.reduce((acc, category) => {
        const categoryTemplates = category === 'all' 
            ? templates 
            : templates.filter(t => t.category === category);
        
        if (categoryTemplates.length > 0) {
            acc[category] = categoryTemplates;
        }
        return acc;
    }, {} as Record<TemplateCategory | 'all', PromptTemplate[]>);

    const toggleCategory = (category: TemplateCategory | 'all') => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(category)) {
            newExpanded.delete(category);
        } else {
            newExpanded.add(category);
        }
        setExpandedCategories(newExpanded);
    };

    return (
        <div className="template-manager">
            <div className="template-header">
                <h3>📋 Шаблоны промптов</h3>
                <button 
                    className="btn-primary"
                    onClick={() => onTemplateEdit(null)}
                    title="Создать новый шаблон"
                >
                    ➕ Новый шаблон
                </button>
            </div>

            <div className="template-categories">
                {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                    <div key={category} className="template-category">
                        <div 
                            className="category-header"
                            onClick={() => toggleCategory(category as TemplateCategory | 'all')}
                        >
                            <span className="category-icon">
                                {expandedCategories.has(category as TemplateCategory | 'all') ? '📂' : '📁'}
                            </span>
                            <span className="category-name">
                                {getCategoryIcon(category as TemplateCategory | 'all')} {getCategoryName(category as TemplateCategory | 'all')}
                            </span>
                            <span className="category-count">
                                ({categoryTemplates.length})
                            </span>
                        </div>

                        {expandedCategories.has(category as TemplateCategory | 'all') && (
                            <div className="template-list">
                                {categoryTemplates.map(template => (
                                    <div 
                                        key={template.id} 
                                        className={`template-item ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                                    >
                                        <div 
                                            className="template-main"
                                            onClick={() => onTemplateSelect(
                                                selectedTemplate?.id === template.id ? null : template
                                            )}
                                        >
                                            <div className="template-icon">
                                                {getCategoryIcon(template.category)}
                                            </div>
                                            <div className="template-info">
                                                <div className="template-name">{template.name}</div>
                                                <div className="template-description">{template.description}</div>
                                            </div>
                                        </div>
                                        
                                        <div className="template-actions">
                                            <button
                                                className="btn-icon"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onTemplatePreview(template);
                                                }}
                                                title="Предпросмотр шаблона"
                                            >
                                                👁️
                                            </button>
                                            
                                            {!template.isBuiltIn && (
                                                <>
                                                    <button
                                                        className="btn-icon"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onTemplateEdit(template);
                                                        }}
                                                        title="Редактировать шаблон"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        className="btn-icon btn-danger"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteTemplate(template.id);
                                                        }}
                                                        title="Удалить шаблон"
                                                    >
                                                        🗑️
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {filteredTemplates.length === 0 && (
                <div className="no-templates">
                    <p>Шаблоны не найдены</p>
                    <button 
                        className="btn-primary"
                        onClick={() => onTemplateEdit(null)}
                    >
                        Создать первый шаблон
                    </button>
                </div>
            )}
        </div>
    );
};

export default TemplateManager; 