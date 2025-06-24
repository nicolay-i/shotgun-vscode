export interface VSCodeAPI {
    postMessage(message: any): void;
    setState(state: any): void;
    getState(): any;
} 