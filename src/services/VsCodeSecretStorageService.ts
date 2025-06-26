import * as vscode from 'vscode';
import { ISecretStorageService } from './ISecretStorageService';

/**
 * Реализация сервиса для безопасного хранения секретов через VS Code SecretStorage API
 */
export class VsCodeSecretStorageService implements ISecretStorageService {
    constructor(private readonly context: vscode.ExtensionContext) {}

    async store(key: string, value: string): Promise<void> {
        await this.context.secrets.store(key, value);
    }

    async get(key: string): Promise<string | undefined> {
        return await this.context.secrets.get(key);
    }

    async delete(key: string): Promise<void> {
        await this.context.secrets.delete(key);
    }

    async exists(key: string): Promise<boolean> {
        const value = await this.get(key);
        return value !== undefined;
    }
} 