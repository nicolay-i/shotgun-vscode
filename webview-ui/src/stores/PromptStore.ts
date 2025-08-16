import { makeAutoObservable, action } from 'mobx';

// Типы для токенов (дублируем из бэкенда для независимости фронтенда)
interface TokenUsage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}

interface AiResponse {
    content: string;
    usage?: TokenUsage;
}

export class PromptStore {
    currentPrompt: string = '';
    aiResponse: AiResponse | null = null;
    isSubmitting: boolean = false;
    isPreviewModalOpen: boolean = false;
    payloadPreviewData: { systemPrompt: string; userPrompt: string; payload: any } | null = null;
    isLoadingPreview: boolean = false;

    constructor() {
        makeAutoObservable(this, {
            setCurrentPrompt: action,
            setAiResponse: action,
            setSubmitting: action,
            clearPrompt: action,
            clearResponse: action,
            clearAll: action,
            setPreviewModalOpen: action,
            setPayloadPreviewData: action,
            setLoadingPreview: action
        });

        this.loadPersistedState();
    }

    setCurrentPrompt(prompt: string) {
        this.currentPrompt = prompt;
        this.savePersistedState();
    }

    setAiResponse(response: AiResponse | string) {
        // Если пришла строка, преобразуем её в объект AiResponse
        if (typeof response === 'string') {
            this.aiResponse = {
                content: response,
                usage: undefined
            };
        } else {
            this.aiResponse = response;
        }
    }

    setSubmitting(submitting: boolean) {
        this.isSubmitting = submitting;
    }

    setPreviewModalOpen(open: boolean) {
        this.isPreviewModalOpen = open;
    }

    setPayloadPreviewData(data: { systemPrompt: string; userPrompt: string; payload: any } | null) {
        this.payloadPreviewData = data;
    }

    setLoadingPreview(loading: boolean) {
        this.isLoadingPreview = loading;
    }

    clearPrompt() {
        this.currentPrompt = '';
        this.savePersistedState();
    }

    clearResponse() {
        this.aiResponse = null;
    }

    clearAll() {
        this.currentPrompt = '';
        this.aiResponse = null;
        this.isSubmitting = false;
        this.savePersistedState();
    }

    get hasResponse(): boolean {
        return this.aiResponse !== null && this.aiResponse.content.length > 0;
    }

    get isValidForSubmission(): boolean {
        return this.currentPrompt.trim().length > 0 && !this.isSubmitting;
    }

    private savePersistedState() {
        const state = {
            currentPrompt: this.currentPrompt
        };
        localStorage.setItem('promptStore', JSON.stringify(state));
    }

    private loadPersistedState() {
        try {
            const saved = localStorage.getItem('promptStore');
            if (saved) {
                const state = JSON.parse(saved);
                if (state.currentPrompt) {
                    this.currentPrompt = state.currentPrompt;
                }
            }
        } catch (error) {
            console.warn('Ошибка загрузки состояния PromptStore:', error);
        }
    }
} 