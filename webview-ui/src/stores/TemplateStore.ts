import { makeAutoObservable, action } from 'mobx';

export interface PromptTemplate {
    id: string;
    name: string;
    description: string;
    systemPrompt: string;
    userPrompt: string;
    isBuiltIn: boolean;
}

// Встроенные шаблоны
const BUILT_IN_TEMPLATES: PromptTemplate[] = [
    {
        id: 'general-analysis',
        name: 'Общий анализ кода',
        description: 'Анализ архитектуры, качества кода и потенциальных проблем',
        systemPrompt: `Ты — опытный senior разработчик программного обеспечения с экспертизой в архитектуре, качестве кода и лучших практиках разработки. 

Твоя задача — тщательно анализировать предоставленный код и давать конструктивную обратную связь. При анализе обращай внимание на:

1. Архитектуру и структуру кода
2. Соблюдение принципов SOLID и других best practices
3. Качество кода (читаемость, поддерживаемость)
4. Потенциальные проблемы производительности
5. Безопасность
6. Тестируемость
7. Соответствие стандартам и конвенциям

Предоставляй практические рекомендации по улучшению с примерами кода где это возможно.`,
        userPrompt: `Проанализируй следующий код и дай развернутый анализ:

Задача: {{ЗАДАЧА}}

Код для анализа:
{{FILES}}

Пожалуйста, структурируй ответ по разделам: архитектура, качество кода, производительность, безопасность, рекомендации по улучшению.`,
        isBuiltIn: true
    },
    {
        id: 'refactoring-plan',
        name: 'План рефакторинга',
        description: 'Создание пошагового плана рефакторинга кода',
        systemPrompt: `Ты — эксперт по рефакторингу кода с многолетним опытом улучшения legacy кодовых баз. 

Твоя специализация — создание детальных, практичных планов рефакторинга, которые:
- Минимизируют риски поломки существующей функциональности
- Улучшают читаемость и поддерживаемость кода
- Следуют принципам чистого кода и SOLID
- Включают промежуточные этапы для безопасного внедрения изменений

При создании планов рефакторинга всегда учитывай существующую архитектуру и предлагай эволюционные, а не революционные изменения.`,
        userPrompt: `Создай детальный план рефакторинга для следующего кода:

Цель рефакторинга: {{ЗАДАЧА}}

Код для рефакторинга:
{{FILES}}

Структурируй план по этапам с описанием:
1. Что будет изменено на каждом этапе
2. Почему это улучшение необходимо
3. Как минимизировать риски
4. Примеры кода до и после (где применимо)`,
        isBuiltIn: true
    },
    {
        id: 'unit-tests',
        name: 'Генерация Unit-тестов',
        description: 'Создание comprehensive unit-тестов',
        systemPrompt: `Ты — QA-инженер и эксперт по тестированию с глубокими знаниями в написании unit-тестов.

Твоя специализация — создание исчерпывающих тестовых наборов, которые:
- Покрывают все ветки кода и граничные случаи
- Тестируют как успешные сценарии, так и error cases
- Используют лучшие практики тестирования (AAA pattern, мокирование, изоляция)
- Имеют понятные и описательные названия
- Легко поддерживаются и расширяются

Предпочитай Jest и React Testing Library для JavaScript/TypeScript проектов, но адаптируйся под используемый в проекте стек.`,
        userPrompt: `Напиши comprehensive unit-тесты для следующего кода:

Тестовые сценарии: {{ЗАДАЧА}}

Код для тестирования:
{{FILES}}

Включи тесты для:
- Всех публичных методов/функций
- Граничных случаев
- Error handling
- Взаимодействия с зависимостями
- Различных входных данных`,
        isBuiltIn: true
    }
];

export class TemplateStore {
    templates: PromptTemplate[] = [];
    selectedTemplateId: string | null = null;

    constructor() {
        makeAutoObservable(this, {
            setTemplates: action,
            addTemplate: action,
            updateTemplate: action,
            deleteTemplate: action,
            selectTemplate: action
        });

        this.loadPersistedState();
        this.initializeBuiltInTemplates();
    }

    private initializeBuiltInTemplates() {
        const existingBuiltInIds = this.templates
            .filter(t => t.isBuiltIn)
            .map(t => t.id);

        BUILT_IN_TEMPLATES.forEach(template => {
            if (!existingBuiltInIds.includes(template.id)) {
                this.templates.push(template);
            }
        });
    }

    get selectedTemplate(): PromptTemplate | null {
        if (!this.selectedTemplateId) return null;
        return this.templates.find(t => t.id === this.selectedTemplateId) || null;
    }

    get customTemplates(): PromptTemplate[] {
        return this.templates.filter(t => !t.isBuiltIn);
    }

    get builtInTemplates(): PromptTemplate[] {
        return this.templates.filter(t => t.isBuiltIn);
    }

    setTemplates(templates: PromptTemplate[]) {
        this.templates = templates;
        this.savePersistedState();
    }

    addTemplate(template: Omit<PromptTemplate, 'id' | 'isBuiltIn'>) {
        const newTemplate: PromptTemplate = {
            ...template,
            id: this.generateId(),
            isBuiltIn: false
        };
        this.templates.push(newTemplate);
        this.savePersistedState();
        return newTemplate;
    }

    updateTemplate(id: string, updates: Partial<PromptTemplate>) {
        const index = this.templates.findIndex(t => t.id === id);
        if (index !== -1 && !this.templates[index].isBuiltIn) {
            this.templates[index] = { ...this.templates[index], ...updates };
            this.savePersistedState();
        }
    }

    deleteTemplate(id: string) {
        const template = this.templates.find(t => t.id === id);
        if (template && !template.isBuiltIn) {
            this.templates = this.templates.filter(t => t.id !== id);
            if (this.selectedTemplateId === id) {
                this.selectedTemplateId = null;
            }
            this.savePersistedState();
        }
    }

    selectTemplate(id: string | null) {
        this.selectedTemplateId = id;
        this.savePersistedState();
    }

    // Предпросмотр шаблона с подстановкой данных
    previewTemplate(template: PromptTemplate, userTask: string, selectedFiles: any[]): {
        systemPrompt: string;
        userPrompt: string;
    } {
        const filesContent = selectedFiles
            .map(file => `\n--- ${file.path} ---\n${file.content || '[содержимое файла]'}`)
            .join('\n');

        const formattedUserPrompt = template.userPrompt
            .replace('{{ЗАДАЧА}}', userTask || '[ваша задача]')
            .replace('{{FILES}}', filesContent || '[выбранные файлы]');

        return {
            systemPrompt: template.systemPrompt,
            userPrompt: formattedUserPrompt
        };
    }

    private generateId(): string {
        return `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    private savePersistedState() {
        const customTemplates = this.customTemplates;
        const state = {
            customTemplates,
            selectedTemplateId: this.selectedTemplateId
        };
        localStorage.setItem('templateStore', JSON.stringify(state));
    }

    private loadPersistedState() {
        try {
            const saved = localStorage.getItem('templateStore');
            if (saved) {
                const state = JSON.parse(saved);
                
                if (state.customTemplates) {
                    this.templates = [...BUILT_IN_TEMPLATES, ...state.customTemplates];
                } else {
                    this.templates = [...BUILT_IN_TEMPLATES];
                }
                
                if (state.selectedTemplateId) {
                    this.selectedTemplateId = state.selectedTemplateId;
                }
            } else {
                this.templates = [...BUILT_IN_TEMPLATES];
            }
        } catch (error) {
            console.warn('Ошибка загрузки состояния TemplateStore:', error);
            this.templates = [...BUILT_IN_TEMPLATES];
        }
    }
} 