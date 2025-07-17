import { makeAutoObservable, action } from 'mobx';

export class AppStore {
    isLoading: boolean = false;
    error: string | null = null;
    workspaceId: string = '';
    private vscodeApi: any = null;

    constructor() {
        makeAutoObservable(this, {
            setLoading: action,
            setError: action,
            clearError: action,
            setWorkspaceId: action
        });

        console.log('[AppStore] Инициализация AppStore...');
        
        // Получаем VS Code API только один раз при инициализации
        if (typeof window !== 'undefined' && (window as any).acquireVsCodeApi) {
            console.log('[AppStore] acquireVsCodeApi доступен, получаем API...');
            this.vscodeApi = (window as any).acquireVsCodeApi();
            console.log('[AppStore] VS Code API получен:', this.vscodeApi ? 'успешно' : 'неудачно');
        } else {
            console.warn('[AppStore] acquireVsCodeApi недоступен!');
        }

        // Запрашиваем workspaceId при инициализации
        this.requestWorkspaceId();
        
        // Подписываемся на сообщения от расширения
        this.setupMessageListener();
    }

    setLoading(loading: boolean) {
        this.isLoading = loading;
    }

    setError(error: string | null) {
        this.error = error;
    }

    clearError() {
        this.error = null;
    }

    setWorkspaceId(workspaceId: string) {
        this.workspaceId = workspaceId;
    }

    // Запрашиваем workspaceId у расширения
    requestWorkspaceId() {
        console.log('[AppStore] Запрашиваем workspaceId...');
        this.sendMessage({
            type: 'getWorkspaceId'
        });
    }

    // Настраиваем слушатель сообщений от расширения
    setupMessageListener() {
        if (typeof window !== 'undefined') {
            window.addEventListener('message', (event) => {
                const message = event.data;
                console.log('[AppStore] Получено сообщение:', message.type, message);
                
                if (message.type === 'workspaceId') {
                    console.log('[AppStore] Получен workspaceId:', message.data.workspaceId);
                    this.setWorkspaceId(message.data.workspaceId);
                }
            });
        }
    }

    // Отправка сообщения в VS Code Extension
    sendMessage(message: any) {
        console.log('[AppStore] Отправка сообщения:', message.type, message);
        
        if (this.vscodeApi) {
            console.log('[AppStore] VS Code API доступен, отправляем сообщение...');
            // Сериализуем объект для безопасной передачи через postMessage
            const serializedMessage = JSON.parse(JSON.stringify(message));
            this.vscodeApi.postMessage(serializedMessage);
            console.log('[AppStore] Сообщение отправлено успешно');
        } else {
            console.warn('[AppStore] VS Code API недоступен при отправке сообщения!');
            console.warn('[AppStore] Сообщение не отправлено:', message);
        }
    }
} 