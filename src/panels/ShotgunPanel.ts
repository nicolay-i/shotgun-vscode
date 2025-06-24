import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class ShotgunPanel {
    public static currentPanel: ShotgunPanel | undefined;
    public static readonly viewType = 'shotgunPanel';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.ViewColumn.One;

        if (ShotgunPanel.currentPanel) {
            ShotgunPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            ShotgunPanel.viewType,
            'Shotgun AI Assistant',
            column,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'out'),
                    vscode.Uri.joinPath(extensionUri, 'src')
                ]
            }
        );

        ShotgunPanel.currentPanel = new ShotgunPanel(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._update();

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.type) {
                    case 'getFiles':
                        await this._sendFileTree();
                        break;
                    case 'getFileContent':
                        await this._sendFileContent(message.filePath);
                        break;
                    case 'openFile':
                        await this._openFile(message.filePath);
                        break;
                    case 'submitToGemini':
                        await this._submitToGemini(message.prompt, message.selectedFiles);
                        break;
                    case 'saveResponse':
                        await this._saveResponse(message.content);
                        break;
                }
            },
            null,
            this._disposables
        );
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

    private async _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    private async _sendFileTree() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return;
        }

        const rootPath = workspaceFolders[0].uri.fsPath;
        const fileTree = await this._buildFileTree(rootPath);

        this._panel.webview.postMessage({
            type: 'fileTree',
            data: fileTree
        });
    }

    private async _buildFileTree(dirPath: string): Promise<any[]> {
        const items: any[] = [];
        const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'out') {
                continue;
            }

            const fullPath = path.join(dirPath, entry.name);
            const relativePath = path.relative(vscode.workspace.workspaceFolders![0].uri.fsPath, fullPath);

            if (entry.isDirectory()) {
                const children = await this._buildFileTree(fullPath);
                items.push({
                    name: entry.name,
                    path: relativePath,
                    type: 'directory',
                    children: children
                });
            } else {
                items.push({
                    name: entry.name,
                    path: relativePath,
                    type: 'file'
                });
            }
        }

        return items.sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === 'directory' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        });
    }

    private async _sendFileContent(filePath: string) {
        try {
            const workspacePath = vscode.workspace.workspaceFolders![0].uri.fsPath;
            const fullPath = path.join(workspacePath, filePath);
            const content = await fs.promises.readFile(fullPath, 'utf8');

            this._panel.webview.postMessage({
                type: 'fileContent',
                data: {
                    path: filePath,
                    content: content
                }
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Ошибка чтения файла: ${error}`);
        }
    }

    private async _openFile(filePath: string) {
        try {
            const workspacePath = vscode.workspace.workspaceFolders![0].uri.fsPath;
            const fullPath = path.join(workspacePath, filePath);
            const fileUri = vscode.Uri.file(fullPath);

            // Открываем файл в новой вкладке
            const document = await vscode.workspace.openTextDocument(fileUri);
            await vscode.window.showTextDocument(document, vscode.ViewColumn.Beside);
        } catch (error) {
            vscode.window.showErrorMessage(`Ошибка открытия файла: ${error}`);
        }
    }

    private async _submitToGemini(prompt: string, selectedFiles: { path: string, content: string }[]) {
        try {
            const config = vscode.workspace.getConfiguration('shotgun');
            const apiKey = config.get<string>('geminiApiKey');

            if (!apiKey) {
                vscode.window.showErrorMessage('Пожалуйста, установите Gemini API ключ в настройках расширения');
                return;
            }

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });

            let fullPrompt = prompt + '\n\n--- Содержимое файлов ---\n\n';
            
            for (const file of selectedFiles) {
                fullPrompt += `=== ${file.path} ===\n${file.content}\n\n`;
            }

            this._panel.webview.postMessage({
                type: 'loadingStart'
            });

            const result = await model.generateContent(fullPrompt);
            const response = result.response.text();

            this._panel.webview.postMessage({
                type: 'geminiResponse',
                data: response
            });

        } catch (error) {
            vscode.window.showErrorMessage(`Ошибка Gemini API: ${error}`);
            this._panel.webview.postMessage({
                type: 'loadingEnd'
            });
        }
    }

    private async _saveResponse(content: string) {
        try {
            const workspacePath = vscode.workspace.workspaceFolders![0].uri.fsPath;
            const date = new Date();
            const formattedDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
            const fileName = `task_${formattedDate}.md`;
            const filePath = path.join(workspacePath, fileName);

            await fs.promises.writeFile(filePath, content, 'utf8');
            vscode.window.showInformationMessage(`Ответ сохранен в файл: ${fileName}`);

            // Открыть файл в редакторе
            const document = await vscode.workspace.openTextDocument(filePath);
            await vscode.window.showTextDocument(document);

        } catch (error) {
            vscode.window.showErrorMessage(`Ошибка сохранения файла: ${error}`);
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'out', 'webview', 'bundle.js')
        );

        // CSP для безопасности
        const nonce = this._getNonce();

        return `<!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
            <title>Shotgun AI Assistant</title>
        </head>
        <body>
            <div id="root"></div>
            <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
        </html>`;
    }

    private _getNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
} 