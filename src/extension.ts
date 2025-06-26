import * as vscode from 'vscode';
import { ShotgunPanel } from './ShotgunPanel';

/**
 * Активация расширения
 * @param context Контекст расширения VS Code
 */
export function activate(context: vscode.ExtensionContext) {
    // Регистрируем команду для открытия панели
    const disposable = vscode.commands.registerCommand('ai-assistant.openPanel', () => {
        ShotgunPanel.createOrShow(context.extensionUri, context);
    });

    context.subscriptions.push(disposable);
}

/**
 * Деактивация расширения
 */
export function deactivate() {
    // Очистка ресурсов при необходимости
} 