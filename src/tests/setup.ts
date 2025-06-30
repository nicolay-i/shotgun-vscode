// Настройка моков для VS Code API
const mockVscode = {
    workspace: {
        workspaceFolders: [{
            uri: { fsPath: '/mock/workspace' }
        }]
    },
    window: {
        createWebviewPanel: jest.fn(),
        showErrorMessage: jest.fn(),
        showInformationMessage: jest.fn()
    },
    Uri: {
        joinPath: jest.fn((base, ...paths) => ({ fsPath: `${base.fsPath}/${paths.join('/')}` })),
        file: jest.fn((path) => ({ fsPath: path }))
    },
    ViewColumn: {
        One: 1
    },
    Disposable: {
        from: jest.fn()
    }
};

// Мокаем модуль vscode
jest.mock('vscode', () => mockVscode, { virtual: true });

// Глобальные настройки для тестов
global.console = {
    ...console,
    warn: jest.fn(),
    error: jest.fn()
}; 