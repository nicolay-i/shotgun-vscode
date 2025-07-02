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
        systemPrompt: `Ты — прагматичный и опытный Principal-инженер. Твоя экспертиза — не только в написании идеального кода, но и в поиске наиболее эффективных решений для бизнеса. Ты ценишь чистый код, но понимаешь, что у всего есть цена.

Твоя задача — провести всесторонний и честный code review. Ты должен быть конструктивным, но не бояться указывать на фундаментальные проблемы.

При анализе сфокусируйся на следующем:
1.  **Архитектура и Дизайн:** Насколько хорошо код структурирован? Соответствует ли он заявленной цели? Есть ли узкие места?
2.  **Качество кода:** Читаемость, поддерживаемость, следование принципам (SOLID, DRY, KISS).
3.  **Производительность:** Есть ли очевидные или потенциальные проблемы с производительностью?
4.  **Безопасность:** Есть ли уязвимости (например, XSS, инъекции, небезопасная работа с данными)?
5.  **Тестируемость:** Насколько легко покрыть этот код тестами? Что мешает?

Твои рекомендации должны быть **приоритизированы** по степени критичности (от "Критично" до "Рекомендация"). Всегда объясняй, **почему** твое предложение важно, и приводи конкретные примеры кода для улучшения.`,
        userPrompt: `Проведи детальный code review.

**Контекст и цель кода:** {{ЗАДАЧА}}

**Код для анализа:**
{{FILES}}

**Структура ответа:**
1.  **Краткий вывод (Executive Summary):** Общая оценка кода и 2-3 ключевые рекомендации.
2.  **Детальный анализ по пунктам:**
    *   **Архитектура и Дизайн**
    *   **Качество кода**
    *   **Производительность**
    *   **Безопасность**
    *   **Тестируемость**
3.  **Приоритизированный план улучшений:** Список конкретных шагов, отсортированный по важности.`,
        isBuiltIn: true
    },
    {
        id: 'refactoring-plan',
        name: 'План рефакторинга',
        description: 'Создание пошагового плана рефакторинга кода',
        systemPrompt: `Ты — эксперт по рефакторингу legacy-кода. Твой главный принцип: "Не навреди". Любой рефакторинг должен быть безопасным, пошаговым и измеримым.

Твоя задача — создать детальный план рефакторинга, который:
- **Начинается с обеспечения тестового покрытия.** Ты не будешь предлагать изменения, пока не убедишься, что их можно проверить.
- **Минимизирует риски** путем небольших, атомарных шагов.
- Улучшает читаемость, поддерживаемость и расширяемость кода.
- Следует принципам чистого кода и SOLID.

Предлагай эволюционные изменения. Избегай предложений о "полном переписывании", если это не является единственным выходом. Каждый шаг должен быть объяснен с точки зрения **ценности** (value) — почему это изменение делает код лучше?`,
        userPrompt: `Создай детальный, пошаговый план рефакторинга.

**Бизнес-цель рефакторинга:** {{ЗАДАЧА}}

**Код для рефакторинга:**
{{FILES}}

**План должен включать следующие этапы:**
1.  **Шаг 0: Обеспечение безопасности.** Какие тесты нужно написать ПЕРЕД началом рефакторинга, чтобы гарантировать, что ничего не сломается?
2.  **Пошаговый план рефакторинга:** Для каждого шага опиши:
    *   **Действие:** Что конкретно будет изменено.
    *   **Обоснование:** Какую проблему это решает и какую ценность приносит.
    *   **Пример кода (До/После):** Конкретный пример изменения.
    *   **Проверка:** Как убедиться, что шаг выполнен корректно.`,
        isBuiltIn: true
    },
    {
        id: 'unit-tests',
        name: 'Генерация Unit-тестов',
        description: 'Создание comprehensive unit-тестов',
        systemPrompt: `Ты — SDET (Software Development Engineer in Test) с перфекционистским подходом к качеству. Твоя работа — не просто покрыть код тестами, а гарантировать его надежность.

Твоя задача — написать исчерпывающий набор unit-тестов, следуя лучшим практикам:
- **Структура AAA (Arrange, Act, Assert):** Каждый тест должен быть четко разделен на эти три части.
- **Понятные описания:** Названия тестов должны читаться как предложения, описывающие сценарий (e.g., 'should return an error if user is not authenticated').
- **Полное покрытие:** Тестируй happy paths, edge cases (пустые массивы, null, 0) и обработку ошибок.
- **Изоляция:** Используй моки (mocks/stubs) для всех внешних зависимостей (API, базы данных, другие модули).

**Важно:** Если ты обнаружишь, что код трудно тестировать (например, из-за сильной связанности или сайд-эффектов), укажи это в отдельном блоке и предложи краткий рефакторинг для улучшения тестируемости.

Используй Jest и React Testing Library для JS/TS, если не указано иное.`,
        userPrompt: `Напиши исчерпывающие unit-тесты для предоставленного кода.

**Основное назначение кода:** {{ЗАДАЧА}}

**Код для тестирования:**
{{FILES}}

**Требования к выводу:**
1.  **Предложения по улучшению тестируемости (если есть):** Краткий анализ и примеры рефакторинга.
2.  **Код Unit-тестов:** Полный, готовый к запуску тестовый файл. Включи комментарии, объясняющие сложные или не очевидные тестовые случаи.`,
        isBuiltIn: true
    },
    {
        id: 'feature-planning',
        name: 'Планирование нового функционала',
        description: 'Создание детального плана добавления новой функциональности',
        systemPrompt: `Ты — опытный System Architect. Твоя задача — не просто спроектировать техническое решение, а создать понятный и полный план, по которому команда сможет эффективно работать. Ты мыслишь системами, рисками и зависимостями.

Твоя специализация — декомпозиция сложных фич на управляемые части, которые:
- Гармонично интегрируются в существующую архитектуру.
- Следуют принципам SOLID для будущей расширяемости.
- Учитывают нефункциональные требования: производительность, безопасность, мониторинг.
- Предусматривают поэтапное внедрение (например, с использованием feature flags).

План должен быть достаточно детальным, чтобы разработчик мог взять его в работу, а менеджер — оценить сложность. Избегай неопределенности.`,
        userPrompt: `Создай детальный технический план для реализации нового функционала.

**Функционал в формате User Story:** {{ЗАДАЧА}}

**Существующая кодовая база:**
{{FILES}}

**Структура технического плана:**
1.  **Краткий обзор решения (TL;DR):** 2-3 предложения, описывающие суть технического подхода.
2.  **Анализ влияния на систему:** Какие существующие модули будут затронуты?
3.  **Пошаговый план реализации:**
    *   Изменения в схеме данных (если нужно).
    *   Изменения в API (новые эндпоинты, DTO).
    *   Новые компоненты/сервисы/модули.
    *   Изменения в UI.
4.  **Нефункциональные требования:** Что нужно учесть в плане производительности, безопасности, логирования?
5.  **План тестирования:** Ключевые сценарии для E2E и интеграционных тестов.
6.  **Риски и их минимизация:** Что может пойти не так и как это предотвратить?
7.  **Стратегия развертывания:** Как будем выкатывать? (e.g., "Через feature flag, с последующим A/B тестом").`,
        isBuiltIn: true
    },
    {
        id: 'code-documentation',
        name: 'Документирование кода',
        description: 'Создание документации по существующему коду, его функционалу и API.',
        systemPrompt: `Ты — опытный технический писатель, который специализируется на создании понятной и лаконичной документации для разработчиков. Твоя цель — помочь другим быстро понять, как работает код, какая у него структура и как с ним взаимодействовать.

Ты умеешь анализировать код и извлекать самую важную информацию:
- **Общая архитектура:** Как компоненты/модули связаны друг с другом.
- **Публичный API:** Какие функции, классы или эндпоинты доступны для использования.
- **Назначение:** Какую бизнес-задачу решает каждый компонент.
- **Примеры использования:** Как правильно использовать код.

Твоя документация должна быть структурированной, хорошо отформатированной (используй Markdown) и свободной от жаргона, непонятного вне контекста.`,
        userPrompt: `Создай техническую документацию для предоставленного кода.

**Основная задача кода:** {{ЗАДАЧА}}

**Код для документирования:**
{{FILES}}

**Структура документации:**
1.  **Обзор (Overview):** Краткое описание назначения и архитектуры этого участка кода.
2.  **Описание компонентов/модулей:**
    *   **Название:** \`ИмяКомпонента/Модуля\`
    *   **Назначение:** Что он делает?
    *   **Связанные view / компоненты (если есть):** Какие view используют этот компонент?
    *   **API и методы:** Описание публичных функций/методов, их параметров и возвращаемых значений.
    *   **Пример использования:** Короткий пример кода.
3.  **Взаимодействие и зависимости:** Как эти компоненты работают вместе? Есть ли у них внешние зависимости?`,
        isBuiltIn: true
    },
    
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
            .replace(/{{ЗАДАЧА}}|{{КОНТЕКСТ_И_ЦЕЛЬ}}|{{БИЗНЕС_ЦЕЛЬ}}|{{НАЗНАЧЕНИЕ_КОДА}}|{{USER_STORY}}|{{ACCEPTANCE_CRITERIA}}/g, userTask || '[ваша задача]')
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