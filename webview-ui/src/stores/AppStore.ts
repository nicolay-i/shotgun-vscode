import { makeAutoObservable, action } from 'mobx';

export class AppStore {
    isLoading: boolean = false;
    error: string | null = null;
    private vscodeApi: any = null;

    constructor() {
        makeAutoObservable(this, {
            setLoading: action,
            setError: action,
            clearError: action
        });

        // Получаем VS Code API только один раз при инициализации
        if (typeof window !== 'undefined' && (window as any).acquireVsCodeApi) {
            this.vscodeApi = (window as any).acquireVsCodeApi();
        }
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

    // Отправка сообщения в VS Code Extension
    sendMessage(message: any) {
        if (this.vscodeApi) {
            // Сериализуем объект для безопасной передачи через postMessage
            const serializedMessage = JSON.parse(JSON.stringify(message));
            this.vscodeApi.postMessage(serializedMessage);
        } else {
            console.warn('VS Code API не доступен');
        }
    }
} 