import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ApiService } from './ApiService';
import { 
    FileNode, 
    Message, 
    GetFileContentMessage, 
    OpenFileMessage, 
    SubmitToAIMessage, 
    SaveResponseMessage 
} from './types';

export class ShotgunPanel {
    public static currentPanel: ShotgunPanel | undefined;
    public static readonly viewType = 'ai-assistant';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private readonly _apiService: ApiService;

    public static createOrShow(extensionUri: vscode.Uri) {
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

        ShotgunPanel.currentPanel = new ShotgunPanel(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._apiService = new ApiService();

        // Устанавливаем HTML содержимое
        this._setWebviewHtml();

        // Слушаем сообщения от webview
        this._setWebviewMessageListener();

        // Убираем панель когда пользователь закрывает её
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
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
            case 'saveResponse':
                await this._handleSaveResponse(message as SaveResponseMessage);
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
        const fileTree = await this._buildFileTree(rootPath);
        
        this._panel.webview.postMessage({
            type: 'fileTree',
            data: fileTree
        });
    }

    private async _buildFileTree(dirPath: string, relativePath = ''): Promise<FileNode[]> {
        const items: FileNode[] = [];
        
        try {
            const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
            
            for (const entry of entries) {
                // Игнорируем системные и нерелевантные директории
                if (this._shouldIgnore(entry.name)) {
                    continue;
                }

                const fullPath = path.join(dirPath, entry.name);
                const itemRelativePath = path.join(relativePath, entry.name);

                if (entry.isDirectory()) {
                    const children = await this._buildFileTree(fullPath, itemRelativePath);
                    items.push({
                        name: entry.name,
                        path: itemRelativePath,
                        type: 'directory',
                        children,
                        isExpanded: false
                    });
                } else if (entry.isFile() && this._isTextFile(entry.name)) {
                    items.push({
                        name: entry.name,
                        path: itemRelativePath,
                        type: 'file'
                    });
                }
            }
        } catch (error) {
            console.error(`Ошибка чтения директории ${dirPath}:`, error);
        }

        return items.sort((a, b) => {
            // Сначала папки, потом файлы
            if (a.type !== b.type) {
                return a.type === 'directory' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        });
    }

    private _shouldIgnore(name: string): boolean {
        const ignorePatterns = [
            '.git',
            'node_modules',
            'out',
            'dist',
            'build',
            '.vscode',
            '.idea',
            '.vs',
            '*.log',
            '.DS_Store',
            'Thumbs.db'
        ];

        return ignorePatterns.some(pattern => {
            if (pattern.startsWith('.')) {
                return name.startsWith(pattern);
            }
            if (pattern.includes('*')) {
                const regex = new RegExp(pattern.replace('*', '.*'));
                return regex.test(name);
            }
            return name === pattern;
        });
    }

    private _isTextFile(fileName: string): boolean {
        const textExtensions = [
            '.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.txt',
            '.html', '.css', '.scss', '.sass', '.less',
            '.py', '.java', '.cs', '.cpp', '.c', '.h',
            '.php', '.rb', '.go', '.rs', '.swift',
            '.xml', '.yaml', '.yml', '.toml', '.ini',
            '.sh', '.bat', '.ps1', '.sql', '.prisma', '.env.example', '.env.local', '.env.development'
        ];

        return textExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
    }

    private async _handleGetFileContent(message: GetFileContentMessage) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            throw new Error('Воркспейс не открыт');
        }

        const rootPath = workspaceFolders[0].uri.fsPath;
        const fullPath = path.join(rootPath, message.data.filePath);

        try {
            const content = await fs.promises.readFile(fullPath, 'utf-8');
            this._panel.webview.postMessage({
                type: 'fileContent',
                data: {
                    path: message.data.filePath,
                    content
                }
            });
        } catch (error: any) {
            throw new Error(`Ошибка чтения файла ${message.data.filePath}: ${error.message}`);
        }
    }

    private async _handleOpenFile(message: OpenFileMessage) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            throw new Error('Воркспейс не открыт');
        }

        const rootPath = workspaceFolders[0].uri.fsPath;
        const fullPath = path.join(rootPath, message.data.filePath);
        const uri = vscode.Uri.file(fullPath);

        try {
            await vscode.window.showTextDocument(uri);
        } catch (error: any) {
            throw new Error(`Ошибка открытия файла ${message.data.filePath}: ${error.message}`);
        }
    }

    private async _handleSubmitToAI(message: SubmitToAIMessage) {
        this._panel.webview.postMessage({ type: 'loadingStart' });

        try {
            // Загружаем содержимое файлов
            const filesWithContent = await Promise.all(
                message.data.selectedFiles.map(async (file) => {
                    if (!file.content) {
                        const workspaceFolders = vscode.workspace.workspaceFolders;
                        if (workspaceFolders) {
                            const rootPath = workspaceFolders[0].uri.fsPath;
                            const fullPath = path.join(rootPath, file.path);
                            const content = await fs.promises.readFile(fullPath, 'utf-8');
                            return { ...file, content };
                        }
                    }
                    return file;
                })
            );

            const response = await this._apiService.sendRequest(
                message.data.prompt,
                filesWithContent,
                message.data.apiConfig,
                message.data.template
            );

            this._panel.webview.postMessage({
                type: 'aiResponse',
                data: response
            });
        } finally {
            this._panel.webview.postMessage({ type: 'loadingEnd' });
        }
    }

    private async _handleSaveResponse(message: SaveResponseMessage) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            throw new Error('Воркспейс не открыт');
        }

        const rootPath = workspaceFolders[0].uri.fsPath;
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
        const fileName = `ai-response-${timestamp}.md`;
        const fullPath = path.join(rootPath, fileName);

        try {
            await fs.promises.writeFile(fullPath, message.data.content, 'utf-8');
            const uri = vscode.Uri.file(fullPath);
            await vscode.window.showTextDocument(uri);
        } catch (error: any) {
            throw new Error(`Ошибка сохранения файла: ${error.message}`);
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
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
} 