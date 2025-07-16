### **Технический план: Сохранение списка выбранных файлов для каждого проекта**

**User Story:** Нужно сохранять список выбранных файлов в рамках проекта. Чтобы в каждом проекте был свой список файлов.

### 1. Краткий обзор решения (TL;DR)

Мы реализуем сохранение состояния выбранных файлов с привязкой к конкретному рабочему пространству (workspace) пользователя. Для этого будет использован нативный механизм VS Code — `ExtensionContext.workspaceState`, который идеально подходит для хранения данных в разрезе проекта. Это решение надежно, безопасно и не требует внешних зависимостей.

Коммуникация между Webview (React) и Extension (Node.js) будет расширена для запроса и сохранения списка файлов при инициализации и изменении выбора.

### 2. Анализ влияния на систему

Новый функционал затронет следующие модули:

*   **Backend (Extension side):**
    *   **`extension.ts`**: Необходимо будет создать экземпляр нового сервиса для управления состоянием проекта и передать ему `ExtensionContext`.
    *   **`MessageHandler.ts`**: Будет расширен для обработки новых типов сообщений (`loadProjectFiles`, `saveProjectFiles`).
    *   **`src/services`**: Появится новый сервис `ProjectStateService.ts` и его интерфейс `IProjectStateService.ts`, отвечающий за инкапсуляцию логики работы с `workspaceState`.
    *   **`src/types.ts`**: Будут добавлены типы для новых сообщений.

*   **Frontend (Webview side):**
    *   **`webview-ui/src/stores/FileStore.ts`**: Основные изменения. Логика сохранения состояния в `localStorage` будет заменена на взаимодействие с backend'ом через `postMessage`.
    *   **`webview-ui/src/App.tsx`**: Потребуется добавить логику для инициализации запроса на получение списка файлов при загрузке панели и для обработки ответа.
    *   **`webview-ui/src/stores/ApiStore.ts`, `TemplateStore.ts`, `PromptStore.ts`**: Не будут затронуты.

### 3. Пошаговый план реализации

#### **Этап 1: Создание сервиса управления состоянием проекта (Backend)**

1.  **Создать интерфейс `IProjectStateService.ts` в `src/services`:**
    *   Этот интерфейс определит контракт для работы с состоянием проекта, что соответствует принципу инверсии зависимостей.

    ```typescript
    // src/services/IProjectStateService.ts
    export interface IProjectStateService {
        /**
         * Получает идентификатор текущего проекта/workspace.
         * @returns Строка-идентификатор или undefined.
         */
        getProjectId(): string | undefined;

        /**
         * Сохраняет список путей к файлам для проекта.
         * @param projectId Идентификатор проекта.
         * @param filePaths Массив путей к файлам.
         */
        saveSelectedFiles(projectId: string, filePaths: string[]): Promise<void>;

        /**
         * Загружает список путей к файлам для проекта.
         * @param projectId Идентификатор проекта.
         * @returns Массив путей к файлам или undefined.
         */
        loadSelectedFiles(projectId: string): Promise<string[] | undefined>;
    }
    ```

2.  **Реализовать `ProjectStateService.ts` в `src/services`:**
    *   Этот класс будет использовать `vscode.ExtensionContext` для доступа к `workspaceState`.

    ```typescript
    // src/services/ProjectStateService.ts
    import * as vscode from 'vscode';
    import { IProjectStateService } from './IProjectStateService';

    const SELECTED_FILES_KEY_PREFIX = 'project_selected_files_';

    export class ProjectStateService implements IProjectStateService {
        constructor(private readonly context: vscode.ExtensionContext) {}

        public getProjectId(): string | undefined {
            // Используем путь к первой папке workspace как уникальный ID проекта
            const workspaceFolders = vscode.workspace.workspaceFolders;
            return workspaceFolders && workspaceFolders.length > 0
                ? workspaceFolders[0].uri.fsPath
                : undefined;
        }

        async saveSelectedFiles(projectId: string, filePaths: string[]): Promise<void> {
            const key = `${SELECTED_FILES_KEY_PREFIX}${projectId}`;
            await this.context.workspaceState.update(key, filePaths);
        }

        async loadSelectedFiles(projectId: string): Promise<string[] | undefined> {
            const key = `${SELECTED_FILES_KEY_PREFIX}${projectId}`;
            return this.context.workspaceState.get<string[]>(key);
        }
    }
    ```

#### **Этап 2: Интеграция нового сервиса (Backend)**

1.  **Обновить `extension.ts`:**
    *   Создать экземпляр `ProjectStateService` и передать его в `ShotgunPanel`.

    ```typescript
    // src/extension.ts (изменения)
    import { ProjectStateService } from './services/ProjectStateService';

    export function activate(context: vscode.ExtensionContext) {
        // ...
        const projectStateService = new ProjectStateService(context);
        const secretStorageService = new VsCodeSecretStorageService(context);
        const apiService = new ApiService();

        const disposable = vscode.commands.registerCommand('ai-assistant.openPanel', () => {
            ShotgunPanel.createOrShow(context.extensionUri, {
                apiService,
                fileSystemService,
                secretStorageService,
                projectStateService // Добавляем новый сервис
            });
        });
        // ...
    }
    ```

2.  **Обновить `ShotgunPanel.ts` и `MessageHandler.ts`:**
    *   Пробросить сервис до `MessageHandler`.

    ```typescript
    // В ShotgunPanel.ts
    // ...
    import { IProjectStateService } from './services/IProjectStateService';
    // ...
    public static createOrShow(
        extensionUri: vscode.Uri,
        services: {
            // ...
            projectStateService: IProjectStateService;
        }
    ) { /* ... */ }

    private constructor(
        // ...
        services: {
            // ...
            projectStateService: IProjectStateService;
        }
    ) {
        // ...
        this._messageHandler = new MessageHandler(
            this._panel,
            services.apiService,
            services.fileSystemService,
            services.secretStorageService,
            services.projectStateService // Передаем сервис
        );
        // ...
    }

    // В MessageHandler.ts
    // ...
    import { IProjectStateService } from './services/IProjectStateService';
    // ...
    export class MessageHandler {
        constructor(
            // ...
            private projectStateService: IProjectStateService
        ) {}
        // ...
    }
    ```

3.  **Добавить обработчики сообщений в `MessageHandler.ts`:**

    ```typescript
    // src/MessageHandler.ts (дополнения)

    // Внутри handleMessage(message: Message)
    // ...
            case 'loadProjectFiles':
                await this.handleLoadProjectFiles();
                break;
            case 'saveProjectFiles':
                await this.handleSaveProjectFiles(message as SaveProjectFilesMessage); // Тип нужно будет добавить
                break;
    // ...

    // Новые приватные методы
    private async handleLoadProjectFiles() {
        const projectId = this.projectStateService.getProjectId();
        if (!projectId) {
            this.panel.webview.postMessage({ type: 'projectFilesLoaded', data: [] });
            return;
        }

        const files = await this.projectStateService.loadSelectedFiles(projectId) || [];
        this.panel.webview.postMessage({
            type: 'projectFilesLoaded',
            data: files
        });
    }

    private async handleSaveProjectFiles(message: SaveProjectFilesMessage) { // Тип нужно будет добавить
        const projectId = this.projectStateService.getProjectId();
        if (projectId) {
            await this.projectStateService.saveSelectedFiles(projectId, message.data.filePaths);
        }
    }
    ```

4.  **Добавить новые типы сообщений в `src/types.ts`:**

    ```typescript
    // src/types.ts (дополнения)
    export interface SaveProjectFilesMessage extends Message {
        type: 'saveProjectFiles';
        data: {
            filePaths: string[];
        };
    }
    ```

#### **Этап 3: Обновление логики состояния (Frontend)**

1.  **Модифицировать `webview-ui/src/stores/FileStore.ts`:**
    *   Убрать зависимость от `localStorage` для хранения выбранных файлов.
    *   Добавить механизм взаимодействия с backend'ом.

    ```typescript
    // webview-ui/src/stores/FileStore.ts (изменения)
    import { makeAutoObservable, action, computed, reaction } from 'mobx';
    import { rootStore } from './RootStore'; // Нужен доступ к appStore

    // ...
    export class FileStore {
        // ... (существующие свойства)

        constructor() {
            makeAutoObservable(/* ... */);
            // УДАЛИТЬ this.loadPersistedState();

            // Реакция на изменение списка выбранных файлов для отправки на бэкенд
            reaction(
                () => this.selectedFilesList.map(f => f.path),
                (filePaths) => {
                    this.saveSelectionToBackend(filePaths);
                },
                { delay: 500 } // Небольшая задержка для предотвращения частых запросов
            );
        }

        // НОВЫЙ МЕТОД: для установки состояния, полученного с бэкенда
        @action
        setInitialSelection(filePaths: string[]) {
            this.selectedFiles.clear();
            filePaths.forEach(path => {
                this.selectedFiles.set(path, { path });
            });
            this.updateTreeWithSelection(this.fileTree);
        }

        // НОВЫЙ МЕТОД: для сохранения состояния
        private saveSelectionToBackend(filePaths: string[]) {
            rootStore.appStore.sendMessage({
                type: 'saveProjectFiles',
                data: { filePaths }
            });
        }

        // УДАЛИТЬ или ЗАКОММЕНТИРОВАТЬ: savePersistedState() и loadPersistedState()
    }
    ```

2.  **Обновить `webview-ui/src/App.tsx`:**
    *   При инициализации приложения запросить сохраненные файлы.
    *   Обработать ответ и передать его в `FileStore`.

    ```tsx
    // webview-ui/src/App.tsx (изменения в AppContent)
    const AppContent: React.FC = observer(() => {
        const { appStore, fileStore, apiStore, promptStore } = rootStore;

        useEffect(() => {
            // ...
            // Запрашиваем и дерево файлов, и сохраненную выборку
            appStore.sendMessage({ type: 'getFiles' });
            appStore.sendMessage({ type: 'loadProjectFiles' }); // <-- НОВЫЙ ЗАПРОС

            const handleMessage = (event: MessageEvent) => {
                const message = event.data;
                switch (message.type) {
                    // ...
                    case 'projectFilesLoaded': // <-- НОВЫЙ ОБРАБОТЧИК
                        fileStore.setInitialSelection(message.data);
                        break;
                    // ...
                }
            };
            // ...
        }, [appStore, fileStore, apiStore, promptStore]); // Добавляем promptStore в зависимости
        // ...
    });
    ```

#### **Этап 4: Миграция существующих данных**

Чтобы обеспечить плавный переход для пользователей, у которых уже есть выбранные файлы в `localStorage`, мы выполним одноразовую миграцию.

1.  **В `FileStore.ts` добавим логику миграции:**

    ```typescript
    // webview-ui/src/stores/FileStore.ts (дополнить конструктор)
    constructor() {
        // ... (после makeAutoObservable)
        this.migrateFromLocalStorage();
        // ... (далее reaction)
    }

    // Новый приватный метод для миграции
    @action
    private migrateFromLocalStorage() {
        const oldStateRaw = localStorage.getItem('fileStore');
        if (oldStateRaw) {
            try {
                const oldState = JSON.parse(oldStateRaw);
                if (oldState.selectedFiles && oldState.selectedFiles.length > 0) {
                    // Если есть старые данные, отправляем их на сохранение в workspaceState
                    this.saveSelectionToBackend(oldState.selectedFiles);
                    console.log(`Мигрировано ${oldState.selectedFiles.length} файлов из localStorage.`);
                }
                // Удаляем старый ключ, чтобы миграция не повторялась
                localStorage.removeItem('fileStore');
            } catch (error) {
                console.error('Ошибка миграции из localStorage:', error);
                localStorage.removeItem('fileStore'); // Очищаем в любом случае
            }
        }
    }
    ```

### 4. Нефункциональные требования

*   **Производительность:** `workspaceState` работает быстро и асинхронно. Мы храним только пути к файлам (строки), что не создает большой нагрузки. `reaction` с задержкой в `FileStore` предотвращает слишком частые операции записи при быстром выделении/снятии выделения файлов.
*   **Безопасность:** Данные хранятся в специальном хранилище VS Code, привязанном к рабочей области. Это безопаснее, чем `localStorage`, и не требует дополнительного шифрования.
*   **Надежность:** Привязка к `workspace.workspaceFolders[0].uri.fsPath` гарантирует, что списки файлов не перепутаются между разными проектами.

### 5. План тестирования

1.  **Unit-тесты:**
    *   Написать тесты для `ProjectStateService`, используя мок `ExtensionContext` для проверки вызовов `update` и `get` с правильными ключами.
    *   Написать тесты для `MessageHandler` на обработку новых сообщений `loadProjectFiles` и `saveProjectFiles`.
    *   Обновить тесты для `FileStore` (в `webview-ui`): проверить, что `sendMessage` вызывается при изменении `selectedFiles` и что `setInitialSelection` корректно обновляет состояние.

2.  **Интеграционные/E2E тесты (ручные):**
    *   **Сценарий 1 (Чистый проект):** Открыть проект -> выбрать файлы -> закрыть/открыть панель -> убедиться, что выбор сохранился.
    *   **Сценарий 2 (Переключение проектов):** Открыть Проект А, выбрать файлы. Открыть Проект Б в новом окне VS Code -> убедиться, что выбор файлов пуст. Вернуться в окно с Проектом А -> убедиться, что выбор восстановлен.
    *   **Сценарий 3 (Миграция):** (Сложно, но возможно) Вручную добавить данные в `localStorage` по старому формату -> запустить расширение -> убедиться, что данные были отправлены на бэкенд и удалены из `localStorage`.
    *   **Сценарий 4 (Нет открытой папки):** Открыть VS Code без папки -> открыть панель -> убедиться, что нет ошибок и выбор файлов пуст и не сохраняется.
