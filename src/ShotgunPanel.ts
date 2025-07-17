import * as vscode from 'vscode';
import * as path from 'path';
import { ApiService } from './ApiService';
import { IFileSystemService } from './services/IFileSystemService';
import { FileSystemService } from './services/FileSystemService';
import { ISecretStorageService } from './services/ISecretStorageService';
import { VsCodeSecretStorageService } from './services/VsCodeSecretStorageService';
import {
    Message,
    GetFileContentMessage,
    OpenFileMessage,
    SubmitToAIMessage,
    SaveResponseMessage,
    GeneratePayloadPreviewMessage,
    GetWorkspaceIdMessage,
    ApiProvider
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

export class ShotgunPanel {
    public static currentPanel: ShotgunPanel | undefined;
    public static readonly viewType = 'ai-assistant';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private readonly _apiService: ApiService;
    private readonly _fileSystemService: IFileSystemService;
    private readonly _secretStorageService: ISecretStorageService;

    public static createOrShow(extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // Если панель уже существует, покажем её
        if (ShotgunPanel.currentPanel) {
            ShotgunPanel.currentPanel._panel.reveal(column);
            return;
        }

        // Создаём новую панель
        const panel = vscode.window.createWebviewPanel(
            ShotgunPanel.viewType,
            'AI Code Assistant',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'webview-ui', 'build')
                ],
            }
        );

        ShotgunPanel.currentPanel = new ShotgunPanel(panel, extensionUri, context);
    }

    private constructor(
        panel: vscode.WebviewPanel, 
        extensionUri: vscode.Uri, 
        context: vscode.ExtensionContext
    ) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._apiService = new ApiService();
        this._fileSystemService = new FileSystemService();
        this._secretStorageService = new VsCodeSecretStorageService(context);

        // Устанавливаем HTML содержимое
        this._setWebviewHtml();

        // Слушаем сообщения от webview
        this._setWebviewMessageListener();

        // Убираем панель когда пользователь закрывает её
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Загружаем секреты при создании панели
        this._loadAndSendSecrets();
        
        // Отправляем workspaceId при инициализации
        this._sendWorkspaceId();
    }

    private _setWebviewHtml() {
        const webview = this._panel.webview;
        
        // Путь к собранному JS файлу
        const scriptPathOnDisk = vscode.Uri.joinPath(
            this._extensionUri,
            'webview-ui',
            'build',
            'webview.js'
        );
        const scriptUri = webview.asWebviewUri(scriptPathOnDisk);

        // Настройки безопасности
        const nonce = this._getNonce();

        this._panel.webview.html = `
            <!DOCTYPE html>
            <html lang="ru">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
                <title>AI Code Assistant</title>
            </head>
            <body>
                <div id="root"></div>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>
        `;
    }

    private _setWebviewMessageListener() {
        this._panel.webview.onDidReceiveMessage(
            async (message: Message) => {
                try {
                    await this._handleMessage(message);
                } catch (error: any) {
                    this._panel.webview.postMessage({
                        type: 'error',
                        data: { message: error.message }
                    });
                }
            },
            null,
            this._disposables
        );
    }

    private async _handleMessage(message: Message) {
        switch (message.type) {
            case 'getFiles':
                await this._handleGetFiles();
                break;
            case 'getFileContent':
                await this._handleGetFileContent(message as GetFileContentMessage);
                break;
            case 'openFile':
                await this._handleOpenFile(message as OpenFileMessage);
                break;
            case 'submitToAI':
                await this._handleSubmitToAI(message as SubmitToAIMessage);
                break;
            case 'generatePayloadPreview':
                await this._handleGeneratePayloadPreview(message as GeneratePayloadPreviewMessage);
                break;
            case 'saveResponse':
                await this._handleSaveResponse(message as SaveResponseMessage);
                break;
            case 'storeSecret':
                await this._handleStoreSecret(message as StoreSecretMessage);
                break;
            case 'loadSecrets':
                await this._handleLoadSecrets(message as LoadSecretsMessage);
                break;
            case 'getWorkspaceId':
                await this._handleGetWorkspaceId(message as GetWorkspaceIdMessage);
                break;
            default:
                console.warn(`Неизвестный тип сообщения: ${message.type}`);
        }
    }

    private async _handleGetFiles() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            this._panel.webview.postMessage({
                type: 'fileTree',
                data: []
            });
            return;
        }

        const rootPath = workspaceFolders[0].uri.fsPath;
        const fileTree = await this._fileSystemService.buildFileTree(rootPath);
        
        this._panel.webview.postMessage({
            type: 'fileTree',
            data: fileTree
        });
    }

    private async _handleGetFileContent(message: GetFileContentMessage) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            throw new Error('Рабочая папка не открыта');
        }

        const rootPath = workspaceFolders[0].uri.fsPath;
        const fullPath = path.join(rootPath, message.data.filePath);
        
        const content = await this._fileSystemService.readFileContent(fullPath);
        
        this._panel.webview.postMessage({
            type: 'fileContent',
            data: {
                path: message.data.filePath,
                content
            }
        });
    }

    private async _handleOpenFile(message: OpenFileMessage) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            throw new Error('Рабочая папка не открыта');
        }

        const rootPath = workspaceFolders[0].uri.fsPath;
        const fullPath = path.join(rootPath, message.data.filePath);
        const document = await vscode.workspace.openTextDocument(fullPath);
        
        await vscode.window.showTextDocument(document);
    }

    private async _handleSubmitToAI(message: SubmitToAIMessage) {
        const { prompt, selectedFiles, apiConfig, template } = message.data;

        // Показываем индикатор загрузки
        this._panel.webview.postMessage({
            type: 'loadingStart'
        });

        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                throw new Error('Рабочая папка не открыта');
            }

            const rootPath = workspaceFolders[0].uri.fsPath;
            
            // Параллельно читаем содержимое всех выбранных файлов
            const filesWithContent = await Promise.all(
                selectedFiles.map(async (file) => {
                    const fullPath = path.join(rootPath, file.path);
                    const content = await this._fileSystemService.readFileContent(fullPath);
                    return { ...file, content };
                })
            );

            const response = await this._apiService.sendRequest(
                prompt,
                filesWithContent,
                apiConfig,
                template
            );

            this._panel.webview.postMessage({
                type: 'aiResponse',
                data: response
            });
        } catch (error: any) {
            throw error;
        } finally {
            // Скрываем индикатор загрузки
            this._panel.webview.postMessage({
                type: 'loadingEnd'
            });
        }
    }

    private async _handleGeneratePayloadPreview(message: GeneratePayloadPreviewMessage) {
        try {
            const { prompt, selectedFiles, apiConfig, template } = message.data;
            
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                throw new Error('Рабочая папка не открыта');
            }

            const rootPath = workspaceFolders[0].uri.fsPath;
            
            // Параллельно читаем содержимое всех выбранных файлов
            const filesWithContent = await Promise.all(
                selectedFiles.map(async (file) => {
                    const fullPath = path.join(rootPath, file.path);
                    const content = await this._fileSystemService.readFileContent(fullPath);
                    return { ...file, content };
                })
            );

            // Генерируем preview payload
            const previewData = this._apiService.generatePayloadPreview(
                prompt,
                filesWithContent,
                apiConfig,
                template
            );

            this._panel.webview.postMessage({
                type: 'payloadPreview',
                data: previewData
            });
        } catch (error: any) {
            this._panel.webview.postMessage({
                type: 'error',
                data: { message: `Ошибка генерации предпросмотра: ${error.message}` }
            });
        }
    }

    private async _handleSaveResponse(message: SaveResponseMessage) {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                throw new Error('Рабочая папка не открыта');
            }

            const rootPath = workspaceFolders[0].uri.fsPath;
            const plansDir = path.join(rootPath, 'plans');
            
            // Создаем папку plans если её нет
            await this._fileSystemService.ensureDirectory(plansDir);

            // Формируем имя файла с шаблоном и timestamp
            const timestamp = new Date().toISOString()
                .replace(/[:.]/g, '-')  // Заменяем недопустимые символы
                .replace('T', '_')      // Заменяем T на _
                .slice(0, 19);          // Убираем миллисекунды и Z

            const templatePart = message.data.templateName 
                ? `${message.data.templateName}_` 
                : 'no-template_';
            
            const fileName = `${templatePart}${timestamp}.md`;
            const fullPath = path.join(plansDir, fileName);

            // Сохраняем файл
            await this._fileSystemService.saveFile(fullPath, message.data.content);

            // Открываем файл для просмотра
            const document = await vscode.workspace.openTextDocument(fullPath);
            await vscode.window.showTextDocument(document);

            // Показываем уведомление об успешном сохранении
            vscode.window.showInformationMessage(`Ответ сохранен в файл: plans/${fileName}`);
        } catch (error: any) {
            vscode.window.showErrorMessage(`Ошибка сохранения файла: ${error.message}`);
        }
    }

    private async _handleStoreSecret(message: StoreSecretMessage) {
        try {
            console.log(`Сохраняем секрет: ${message.data.key} = ${message.data.value.substring(0, 8)}...`);
            await this._secretStorageService.store(message.data.key, message.data.value);
            console.log(`Секрет сохранен успешно: ${message.data.key}`);
        } catch (error: any) {
            console.warn('Ошибка сохранения секрета:', error);
        }
    }

    private async _handleLoadSecrets(_message: LoadSecretsMessage) {
        await this._loadAndSendSecrets();
    }

    private async _handleGetWorkspaceId(_message: GetWorkspaceIdMessage) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        
        if (!workspaceFolders || workspaceFolders.length === 0) {
            // Если нет рабочего пространства, отправляем пустой ID
            this._panel.webview.postMessage({
                type: 'workspaceId',
                data: { workspaceId: '' }
            });
            return;
        }

        const workspaceId = workspaceFolders[0].uri.fsPath;
        
        this._panel.webview.postMessage({
            type: 'workspaceId',
            data: { workspaceId }
        });
    }

    private async _sendWorkspaceId() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        
        if (!workspaceFolders || workspaceFolders.length === 0) {
            // Если нет рабочего пространства, отправляем пустой ID
            this._panel.webview.postMessage({
                type: 'workspaceId',
                data: { workspaceId: '' }
            });
            return;
        }

        const workspaceId = workspaceFolders[0].uri.fsPath;
        
        this._panel.webview.postMessage({
            type: 'workspaceId',
            data: { workspaceId }
        });
    }

    private async _loadAndSendSecrets() {
        try {
            const secrets: Partial<Record<ApiProvider, string>> = {};
            
            console.log('Загружаем секреты из VS Code SecretStorage...');
            
            // Загружаем API ключи для всех провайдеров
            for (const provider of Object.values(ApiProvider)) {
                const key = await this._secretStorageService.get(`ai-assistant.apiKey.${provider}`);
                if (key) {
                    secrets[provider] = key;
                    console.log(`Найден ключ для ${provider}: ${key.substring(0, 8)}...`);
                } else {
                    console.log(`Ключ для ${provider} не найден`);
                }
            }

            console.log('Отправляем секреты в webview:', Object.keys(secrets));
            
            this._panel.webview.postMessage({
                type: 'secretsLoaded',
                data: secrets
            });
        } catch (error: any) {
            console.warn('Ошибка загрузки секретов:', error);
        }
    }

    private _getNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    public dispose() {
        ShotgunPanel.currentPanel = undefined;

        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
} 