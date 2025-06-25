import { makeAutoObservable, action } from 'mobx';

export class AppStore {
    isLoading: boolean = false;
    error: string | null = null;

    constructor() {
        makeAutoObservable(this, {
            setLoading: action,
            setError: action,
            clearError: action
        });
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
        if (typeof window !== 'undefined' && (window as any).acquireVsCodeApi) {
            const vscode = (window as any).acquireVsCodeApi();
            vscode.postMessage(message);
        }
    }
} 