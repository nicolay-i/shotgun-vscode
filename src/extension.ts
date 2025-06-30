import * as vscode from 'vscode';
import { ShotgunPanel } from './ShotgunPanel';
import { ApiService } from './ApiService';
import { FileSystemService } from './services/FileSystemService';
import { VsCodeSecretStorageService } from './services/VsCodeSecretStorageService';

/**
 * Активация расширения
 * @param context Контекст расширения VS Code
 */
export function activate(context: vscode.ExtensionContext) {
    // Создаем экземпляры сервисов
    const fileSystemService = new FileSystemService();
    const secretStorageService = new VsCodeSecretStorageService(context);
    const apiService = new ApiService();

    // Регистрируем команду для открытия панели
    const disposable = vscode.commands.registerCommand('ai-assistant.openPanel', () => {
        ShotgunPanel.createOrShow(context.extensionUri, {
            apiService,
            fileSystemService,
            secretStorageService
        });
    });

    context.subscriptions.push(disposable);
}

/**
 * Деактивация расширения
 */
export function deactivate() {
    // Очистка ресурсов при необходимости
} 