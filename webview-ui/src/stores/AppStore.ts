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

        console.log('[AppStore] Инициализация AppStore...');
        
        // Получаем VS Code API только один раз при инициализации
        if (typeof window !== 'undefined' && (window as any).acquireVsCodeApi) {
            console.log('[AppStore] acquireVsCodeApi доступен, получаем API...');
            this.vscodeApi = (window as any).acquireVsCodeApi();
            console.log('[AppStore] VS Code API получен:', this.vscodeApi ? 'успешно' : 'неудачно');
        } else {
            console.warn('[AppStore] acquireVsCodeApi недоступен!');
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