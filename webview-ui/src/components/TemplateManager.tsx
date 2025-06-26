import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useTemplateStore } from '../contexts/StoreContext';
import { TemplateEditor } from './TemplateEditor';
import { TemplatePreview } from './TemplatePreview';
import { 
    Plus, 
    Eye, 
    PencilSimple, 
    Trash, 
    Check,
    Circle 
} from 'phosphor-react';
import { PromptTemplate } from '../stores/TemplateStore';

export const TemplateManager: React.FC = observer(() => {
    const templateStore = useTemplateStore();
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
    const [previewTemplate, setPreviewTemplate] = useState<PromptTemplate | null>(null);

    const handleCreateNew = () => {
        setEditingTemplate(null);
        setIsEditorOpen(true);
    };

    const handleEdit = (template: PromptTemplate) => {
        if (template.isBuiltIn) return; // Встроенные шаблоны нельзя редактировать
        setEditingTemplate(template);
        setIsEditorOpen(true);
    };

    const handlePreview = (template: PromptTemplate) => {
        setPreviewTemplate(template);
        setIsPreviewOpen(true);
    };

    const handleDelete = (template: PromptTemplate) => {
        if (template.isBuiltIn) return; // Встроенные шаблоны нельзя удалять
        if (confirm(`Удалить шаблон "${template.name}"?`)) {
            templateStore.deleteTemplate(template.id);
        }
    };

    const handleSaveTemplate = (template: PromptTemplate) => {
        if (editingTemplate) {
            templateStore.updateTemplate(template.id, template);
        } else {
            templateStore.addTemplate(template);
        }
        setIsEditorOpen(false);
        setEditingTemplate(null);
    };

    const handleSelectTemplate = (template: PromptTemplate) => {
        templateStore.selectTemplate(template.id);
    };

    const handleUseTemplate = () => {
        if (previewTemplate) {
            templateStore.selectTemplate(previewTemplate.id);
            setIsPreviewOpen(false);
            setPreviewTemplate(null);
        }
    };

    return (
        <div className="template-manager">
            <div className="template-manager__header">
                <h3 className="app__section-title">Шаблоны промптов</h3>
                <button
                    className="btn btn--primary btn--small"
                    onClick={handleCreateNew}
                    title="Создать новый шаблон"
                >
                    <Plus size={14} />
                    Новый шаблон
                </button>
            </div>

            <div className="template-manager__content">
                {templateStore.templates.length === 0 ? (
                    <div className="template-manager__empty">
                        <p className="text-small">Нет доступных шаблонов</p>
                    </div>
                ) : (
                    <div className="template-list">
                        {templateStore.templates.map((template: PromptTemplate) => (
                            <div 
                                key={template.id} 
                                className={`template-item ${
                                    templateStore.selectedTemplateId === template.id 
                                        ? 'template-item--selected' 
                                        : ''
                                }`}
                            >
                                <div className="template-item__header">
                                    <button
                                        className="template-item__selector"
                                        onClick={() => handleSelectTemplate(template)}
                                        title="Выбрать этот шаблон"
                                    >
                                        {templateStore.selectedTemplateId === template.id ? (
                                            <Check size={16} />
                                        ) : (
                                            <Circle size={16} />
                                        )}
                                    </button>
                                    <div className="template-item__info">
                                        <h4 className="template-item__name">
                                            {template.name}
                                            {template.isBuiltIn && (
                                                <span className="template-item__badge">Встроенный</span>
                                            )}
                                        </h4>
                                        {template.description && (
                                            <p className="template-item__description">
                                                {template.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="template-item__actions">
                                    <button
                                        className="btn btn--secondary btn--small"
                                        onClick={() => handlePreview(template)}
                                        title="Предпросмотр шаблона"
                                    >
                                        <Eye size={14} />
                                        Предпросмотр
                                    </button>
                                    {!template.isBuiltIn && (
                                        <>
                                            <button
                                                className="btn btn--secondary btn--small"
                                                onClick={() => handleEdit(template)}
                                                title="Редактировать шаблон"
                                            >
                                                <PencilSimple size={14} />
                                                Редактировать
                                            </button>
                                            <button
                                                className="btn btn--secondary btn--small template-item__delete"
                                                onClick={() => handleDelete(template)}
                                                title="Удалить шаблон"
                                            >
                                                <Trash size={14} />
                                                Удалить
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Модальные окна */}
            <TemplateEditor
                isOpen={isEditorOpen}
                template={editingTemplate}
                onSave={handleSaveTemplate}
                onClose={() => {
                    setIsEditorOpen(false);
                    setEditingTemplate(null);
                }}
            />

            <TemplatePreview
                isOpen={isPreviewOpen}
                template={previewTemplate}
                onUse={handleUseTemplate}
                onClose={() => {
                    setIsPreviewOpen(false);
                    setPreviewTemplate(null);
                }}
            />
        </div>
    );
}); 