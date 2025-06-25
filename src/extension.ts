import * as vscode from 'vscode';
import { ShotgunPanel } from './ShotgunPanel';

export function activate(context: vscode.ExtensionContext) {
    // Команда для открытия панели
    const openPanelCommand = vscode.commands.registerCommand(
        'ai-assistant.openPanel',
        () => {
            ShotgunPanel.createOrShow(context.extensionUri);
        }
    );

    context.subscriptions.push(openPanelCommand);
}

export function deactivate() {} 