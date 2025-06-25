import { PromptTemplate, TemplateCategory } from '../../types/ApiTypes';

export const getDefaultTemplates = (): PromptTemplate[] => {
    return [
        {
            id: 'code-editing-1',
            name: 'Редактирование кода',
            description: 'Шаблон для внесения изменений в код',
            systemPrompt: `Ты опытный разработчик программного обеспечения. Твоя задача - анализировать предоставленный код и вносить необходимые изменения согласно запросу пользователя.

Правила:
- Всегда объясняй какие изменения ты вносишь и почему
- Сохраняй стиль кодирования и архитектуру проекта
- Предлагай оптимальные решения
- Если нужно, предлагай альтернативные варианты
- Убедись что код остается читаемым и поддерживаемым`,
            userPrompt: `Проанализируй следующий код и внеси необходимые изменения:

{{ЗАДАЧА}}

Файлы для анализа:
{{FILES}}`,
            category: 'code-editing',
            isBuiltIn: true,
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            id: 'improvement-plan-1',
            name: 'План доработок',
            description: 'Шаблон для создания плана улучшений кода',
            systemPrompt: `Ты опытный архитектор программного обеспечения. Твоя задача - анализировать код и создавать детальный план его улучшения.

Твой ответ должен включать:
1. Анализ текущего состояния кода
2. Выявленные проблемы и области для улучшения
3. Приоритизированный план доработок
4. Оценку сложности каждой задачи
5. Рекомендации по последовательности выполнения`,
            userPrompt: `Создай детальный план доработок для следующего кода:

Фокус анализа: {{ЗАДАЧА}}

Файлы для анализа:
{{FILES}}

Пожалуйста, предоставь структурированный план с приоритетами и временными оценками.`,
            category: 'improvement-plan',
            isBuiltIn: true,
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            id: 'refactoring-plan-1',
            name: 'План рефакторинга',
            description: 'Шаблон для создания плана рефакторинга кода',
            systemPrompt: `Ты эксперт по рефакторингу кода. Твоя задача - анализировать код и создавать пошаговый план рефакторинга.

Твой анализ должен включать:
1. Выявление code smells и антипаттернов
2. Анализ архитектурных проблем
3. Пошаговый план рефакторинга
4. Оценку рисков для каждого шага
5. Рекомендации по тестированию
6. Метрики для измерения улучшений`,
            userPrompt: `Создай пошаговый план рефакторинга для следующего кода:

Цель рефакторинга: {{ЗАДАЧА}}

Файлы для анализа:
{{FILES}}

Пожалуйста, предоставь детальный план с оценкой рисков и рекомендациями по тестированию.`,
            category: 'refactoring-plan',
            isBuiltIn: true,
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ];
};

export const loadTemplates = (): PromptTemplate[] => {
    const defaultTemplates = getDefaultTemplates();
    const savedTemplates = localStorage.getItem('shotgun_templates');
    
    if (savedTemplates) {
        try {
            const customTemplates = JSON.parse(savedTemplates);
            return [...defaultTemplates, ...customTemplates];
        } catch (e) {
            console.error('Ошибка загрузки шаблонов:', e);
            return defaultTemplates;
        }
    }
    
    return defaultTemplates;
};

export const saveCustomTemplates = (allTemplates: PromptTemplate[]): void => {
    const customTemplates = allTemplates.filter(t => !t.isBuiltIn);
    localStorage.setItem('shotgun_templates', JSON.stringify(customTemplates));
};

export const getCategoryIcon = (category: TemplateCategory | 'all'): string => {
    switch (category) {
        case 'code-editing': return '✏️';
        case 'improvement-plan': return '📈';
        case 'refactoring-plan': return '🔧';
        case 'custom': return '⚙️';
        default: return '📋';
    }
};

export const getCategoryName = (category: TemplateCategory | 'all'): string => {
    switch (category) {
        case 'all': return 'Все шаблоны';
        case 'code-editing': return 'Редактирование кода';
        case 'improvement-plan': return 'План доработок';
        case 'refactoring-plan': return 'План рефакторинга';
        case 'custom': return 'Пользовательские';
        default: return 'Неизвестная категория';
    }
};

export const processTemplate = (
    template: PromptTemplate,
    userInput: string,
    filesContent: string
): string => {
    const processedUserPrompt = template.userPrompt
        .replace(/\{\{ЗАДАЧА\}\}/g, userInput || '[Пользователь не ввел задачу]')
        .replace(/\{\{FILES\}\}/g, filesContent || '[Файлы не выбраны]');

    return `${template.systemPrompt}\n\n---\n\n${processedUserPrompt}`;
};

export const generateTemplateId = (): string => {
    return `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const validateTemplate = (template: Partial<PromptTemplate>): string[] => {
    const errors: string[] = [];
    
    if (!template.name?.trim()) {
        errors.push('Название шаблона обязательно для заполнения');
    }
    
    if (!template.systemPrompt?.trim()) {
        errors.push('Системный промпт обязателен для заполнения');
    }
    
    if (!template.userPrompt?.trim()) {
        errors.push('Пользовательский промпт обязателен для заполнения');
    }
    
    if (!template.category) {
        errors.push('Категория шаблона обязательна для заполнения');
    }
    
    return errors;
}; 