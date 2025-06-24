import * as vscode from 'vscode';
import { ShotgunPanel } from './panels/ShotgunPanel';

export function activate(context: vscode.ExtensionContext) {
    console.log('Shotgun AI Assistant активирован');

    // Установить флаг для включения панели
    vscode.commands.executeCommand('setContext', 'shotgun.enabled', true);

    // Команда для открытия панели
    const openPanelCommand = vscode.commands.registerCommand('shotgun.openPanel', () => {
        ShotgunPanel.createOrShow(context.extensionUri);
    });

    context.subscriptions.push(openPanelCommand);

    // Автоматически открыть панель при активации
    ShotgunPanel.createOrShow(context.extensionUri);
}

export function deactivate() {
    console.log('Shotgun AI Assistant деактивирован');
} 