import { makeAutoObservable, action } from 'mobx';

export class PromptStore {
    currentPrompt: string = '';
    aiResponse: string = '';
    isSubmitting: boolean = false;
    isPreviewModalOpen: boolean = false;

    constructor() {
        makeAutoObservable(this, {
            setCurrentPrompt: action,
            setAiResponse: action,
            setSubmitting: action,
            clearPrompt: action,
            clearResponse: action,
            clearAll: action,
            setPreviewModalOpen: action
        });

        this.loadPersistedState();
    }

    setCurrentPrompt(prompt: string) {
        this.currentPrompt = prompt;
        this.savePersistedState();
    }

    setAiResponse(response: string) {
        this.aiResponse = response;
    }

    setSubmitting(submitting: boolean) {
        this.isSubmitting = submitting;
    }

    setPreviewModalOpen(open: boolean) {
        this.isPreviewModalOpen = open;
    }

    clearPrompt() {
        this.currentPrompt = '';
        this.savePersistedState();
    }

    clearResponse() {
        this.aiResponse = '';
    }

    clearAll() {
        this.currentPrompt = '';
        this.aiResponse = '';
        this.isSubmitting = false;
        this.savePersistedState();
    }

    get hasResponse(): boolean {
        return this.aiResponse.length > 0;
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