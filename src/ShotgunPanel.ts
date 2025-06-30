import * as vscode from 'vscode';
import { IApiService } from './IApiService';
import { IFileSystemService } from './services/IFileSystemService';
import { ISecretStorageService } from './services/ISecretStorageService';
import { MessageHandler } from './MessageHandler';
import { Message } from './types';

export class ShotgunPanel {
    public static currentPanel: ShotgunPanel | undefined;
    public static readonly viewType = 'ai-assistant';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private readonly _messageHandler: MessageHandler;

    public static createOrShow(
        extensionUri: vscode.Uri,
        services: {
            apiService: IApiService;
            fileSystemService: IFileSystemService;
            secretStorageService: ISecretStorageService;
        }
    ) {
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

        ShotgunPanel.currentPanel = new ShotgunPanel(panel, extensionUri, services);
    }

    private constructor(
        panel: vscode.WebviewPanel, 
        extensionUri: vscode.Uri, 
        services: {
            apiService: IApiService;
            fileSystemService: IFileSystemService;
            secretStorageService: ISecretStorageService;
        }
    ) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        
        // Создаем MessageHandler с сервисами
        this._messageHandler = new MessageHandler(
            this._panel,
            services.apiService,
            services.fileSystemService,
            services.secretStorageService
        );

        // Устанавливаем HTML содержимое
        this._setWebviewHtml();

        // Слушаем сообщения от webview
        this._setWebviewMessageListener();

        // Убираем панель когда пользователь закрывает её
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Загружаем секреты при создании панели
        this._messageHandler.handleMessage({ type: 'loadSecrets', data: {} });
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
                    // Просто делегируем все сообщения MessageHandler
                    await this._messageHandler.handleMessage(message);
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