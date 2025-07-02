import * as vscode from 'vscode';
import * as path from 'path';
import { IApiService } from './IApiService';
import { IFileSystemService } from './services/IFileSystemService';
import { ISecretStorageService } from './services/ISecretStorageService';
import { 
    Message, 
    GetFileContentMessage, 
    OpenFileMessage, 
    SubmitToAIMessage, 
    SaveResponseMessage,
    GeneratePayloadPreviewMessage
} from './types';

/**
 * Сообщения для работы с секретами
 */
interface StoreSecretMessage extends Message {
    type: 'storeSecret';
    data: {
        key: string;
        value: string;
    };
}

interface LoadSecretsMessage extends Message {
    type: 'loadSecrets';
    data: {};
}

/**
 * Обработчик сообщений от webview
 * Отвечает за всю бизнес-логику и координацию сервисов
 */
export class MessageHandler {
    constructor(
        private panel: vscode.WebviewPanel,
        private apiService: IApiService,
        private fileSystemService: IFileSystemService,
        private secretStorageService: ISecretStorageService
    ) {}

    /**
     * Главный метод обработки сообщений
     * @param message Сообщение от webview
     */
    public async handleMessage(message: Message): Promise<void> {
        switch (message.type) {
            case 'getFiles':
                await this.handleGetFiles();
                break;
            case 'getFileContent':
                await this.handleGetFileContent(message as GetFileContentMessage);
                break;
            case 'openFile':
                await this.handleOpenFile(message as OpenFileMessage);
                break;
            case 'submitToAI':
                await this.handleSubmitToAI(message as SubmitToAIMessage);
                break;
            case 'generatePayloadPreview':
                await this.handleGeneratePayloadPreview(message as GeneratePayloadPreviewMessage);
                break;
            case 'saveResponse':
                await this.handleSaveResponse(message as SaveResponseMessage);
                break;
            case 'storeSecret':
                await this.handleStoreSecret(message as StoreSecretMessage);
                break;
            case 'loadSecrets':
                await this.handleLoadSecrets(message as LoadSecretsMessage);
                break;
            default:
                console.warn(`Неизвестный тип сообщения: ${message.type}`);
        }
    }

    private async handleGetFiles() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            this.panel.webview.postMessage({
                type: 'fileTree',
                data: []
            });
            return;
        }

        const rootPath = workspaceFolders[0].uri.fsPath;
        const fileTree = await this.fileSystemService.buildFileTree(rootPath);
        
        this.panel.webview.postMessage({
            type: 'fileTree',
            data: fileTree
        });
    }

    private async handleGetFileContent(message: GetFileContentMessage) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            throw new Error('Рабочая папка не открыта');
        }

        const rootPath = workspaceFolders[0].uri.fsPath;
        const filePath = path.join(rootPath, message.data.filePath);
        const content = await this.fileSystemService.readFileContent(filePath);
        
        this.panel.webview.postMessage({
            type: 'fileContent',
            data: {
                path: message.data.filePath,
                content: content
            }
        });
    }

    private async handleOpenFile(message: OpenFileMessage) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            throw new Error('Рабочая папка не открыта');
        }

        const rootPath = workspaceFolders[0].uri.fsPath;
        const filePath = path.join(rootPath, message.data.filePath);
        const document = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(document);
    }

    private async handleSubmitToAI(message: SubmitToAIMessage) {
        // Отправляем сообщение о начале загрузки
        this.panel.webview.postMessage({
            type: 'loadingStart'
        });

        try {
            const { prompt, selectedFiles, apiConfig, template } = message.data;
            
            const response = await this.apiService.sendRequest(
                prompt,
                selectedFiles,
                apiConfig,
                template
            );

            this.panel.webview.postMessage({
                type: 'aiResponse',
                data: response
            });
        } catch (error: any) {
            this.panel.webview.postMessage({
                type: 'error',
                data: { message: error.message }
            });
        } finally {
            this.panel.webview.postMessage({
                type: 'loadingEnd'
            });
        }
    }

    private async handleGeneratePayloadPreview(message: GeneratePayloadPreviewMessage) {
        try {
            const { prompt, selectedFiles, apiConfig, template } = message.data;
            
            const previewData = this.apiService.generatePayloadPreview(
                prompt,
                selectedFiles,
                apiConfig,
                template
            );

            this.panel.webview.postMessage({
                type: 'payloadPreview',
                data: previewData
            });
        } catch (error: any) {
            this.panel.webview.postMessage({
                type: 'error',
                data: { message: error.message }
            });
        }
    }

    private async handleSaveResponse(message: SaveResponseMessage) {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                throw new Error('Рабочая папка не открыта');
            }

            const { content, templateName } = message.data;
            const rootPath = workspaceFolders[0].uri.fsPath;
            
            // Создаём папку plans если её нет
            const plansDir = path.join(rootPath, 'plans');
            await this.fileSystemService.ensureDirectory(plansDir);
            
            // Генерируем имя файла
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = templateName 
                ? `${templateName}_${timestamp}.md`
                : `plan_${timestamp}.md`;
            
            const filePath = path.join(plansDir, fileName);
            await this.fileSystemService.saveFile(filePath, content);
            
            // Показываем сообщение об успехе
            vscode.window.showInformationMessage(`Ответ сохранён в ${fileName}`);
        } catch (error: any) {
            this.panel.webview.postMessage({
                type: 'error',
                data: { message: error.message }
            });
        }
    }

    private async handleStoreSecret(message: StoreSecretMessage) {
        try {
            const { key, value } = message.data;
            await this.secretStorageService.store(key, value);
        } catch (error: any) {
            console.error('Ошибка сохранения секрета:', error);
        }
    }

    private async handleLoadSecrets(_message: LoadSecretsMessage) {
        await this.loadAndSendSecrets();
    }

    private async loadAndSendSecrets() {
        try {
            const secrets: { [key: string]: string } = {};
            
            // Загружаем все известные ключи
            const keys = ['openai_api_key', 'gemini_api_key', 'openrouter_api_key', 'custom_api_key'];
            
            for (const key of keys) {
                const value = await this.secretStorageService.get(key);
                if (value) {
                    secrets[key] = value;
                }
            }
            
            this.panel.webview.postMessage({
                type: 'secretsLoaded',
                data: secrets
            });
        } catch (error: any) {
            console.error('Ошибка загрузки секретов:', error);
            this.panel.webview.postMessage({
                type: 'error',
                data: { message: 'Ошибка загрузки сохранённых ключей' }
            });
        }
    }
} 