import { makeAutoObservable, action } from 'mobx';

export interface AIResponseData {
    response: string;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
        cost_request?: number;
        cost_response?: number;
        cost_total?: number;
    };
    cost?: {
        totalCost: number;
        promptCost: number;
        completionCost: number;
        currency: string;
    };
}

export class PromptStore {
    currentPrompt: string = '';
    aiResponse: string = '';
    tokenUsage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
    costInfo?: {
        totalCost: number;
        promptCost: number;
        completionCost: number;
        currency: string;
    };
    isSubmitting: boolean = false;
    isPreviewModalOpen: boolean = false;
    payloadPreviewData: { systemPrompt: string; userPrompt: string; payload: any } | null = null;
    isLoadingPreview: boolean = false;

    constructor() {
        makeAutoObservable(this, {
            setCurrentPrompt: action,
            setAiResponse: action,
            setSubmitting: action,
            setTokenUsage: action,
            setCostInfo: action,
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

    setAiResponse(response: string) {
        this.aiResponse = response;
    }

    setTokenUsage(usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }) {
        this.tokenUsage = usage;
    }

    setCostInfo(cost: { totalCost: number; promptCost: number; completionCost: number; currency: string }) {
        this.costInfo = cost;
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
        this.aiResponse = '';
        this.tokenUsage = undefined;
        this.costInfo = undefined;
    }

    clearAll() {
        this.currentPrompt = '';
        this.aiResponse = '';
        this.tokenUsage = undefined;
        this.costInfo = undefined;
        this.isSubmitting = false;
        this.savePersistedState();
    }

    get hasResponse(): boolean {
        return this.aiResponse.length > 0;
    }

    get isValidForSubmission(): boolean {
        return this.currentPrompt.trim().length > 0 && !this.isSubmitting;
    }

    get hasTokenInfo(): boolean {
        return !!(this.tokenUsage && this.costInfo);
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