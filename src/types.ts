// Типы для файловой системы
export interface FileNode {
    name: string;
    path: string;
    type: 'file' | 'directory';
    children?: FileNode[];
    isSelected?: boolean;
    isExpanded?: boolean;
}

export interface SelectedFile {
    path: string;
    content?: string;
}

// Типы для API
export enum ApiProvider {
    Gemini = 'gemini',
    OpenAI = 'openai',
    OpenRouter = 'openrouter',
    Custom = 'custom'
}

export interface ApiConfig {
    provider: ApiProvider;
    apiKey: string;
    customUrl?: string;
    model: string;
}

// Типы для шаблонов
export interface PromptTemplate {
    id: string;
    name: string;
    description: string;
    systemPrompt: string;
    userPrompt: string;
    isBuiltIn: boolean;
}

// Типы для сообщений между Extension и Webview
export interface Message {
    type: string;
    data?: any;
}

export interface GetFilesMessage extends Message {
    type: 'getFiles';
}

export interface GetFileContentMessage extends Message {
    type: 'getFileContent';
    data: {
        filePath: string;
    };
}

export interface OpenFileMessage extends Message {
    type: 'openFile';
    data: {
        filePath: string;
    };
}

export interface SubmitToAIMessage extends Message {
    type: 'submitToAI';
    data: {
        prompt: string;
        selectedFiles: SelectedFile[];
        apiConfig: ApiConfig;
        template?: PromptTemplate;
    };
}

export interface GeneratePayloadPreviewMessage extends Message {
    type: 'generatePayloadPreview';
    data: {
        prompt: string;
        selectedFiles: SelectedFile[];
        apiConfig: ApiConfig;
        template?: PromptTemplate;
    };
}

export interface PayloadPreviewMessage extends Message {
    type: 'payloadPreview';
    data: {
        systemPrompt: string;
        userPrompt: string;
        payload: any;
    };
}

export interface SaveResponseMessage extends Message {
    type: 'saveResponse';
    data: {
        content: string;
        templateName?: string;
    };
}

export interface FileTreeMessage extends Message {
    type: 'fileTree';
    data: FileNode[];
}

export interface FileContentMessage extends Message {
    type: 'fileContent';
    data: {
        path: string;
        content: string;
    };
}

export interface AIResponseMessage extends Message {
    type: 'aiResponse';
    data: string;
}

export interface LoadingMessage extends Message {
    type: 'loadingStart' | 'loadingEnd';
}

export interface ErrorMessage extends Message {
    type: 'error';
    data: {
        message: string;
    };
} 