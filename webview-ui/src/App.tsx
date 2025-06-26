import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { StoreProvider } from './contexts/StoreContext';
import { rootStore } from './stores/RootStore';
import { FileTree } from './components/FileTree';
import { ApiSettings } from './components/ApiSettings';
import { TemplateManager } from './components/TemplateManager';
import { PromptSection } from './components/PromptSection';
import { SelectedFiles } from './components/SelectedFiles';
import { ResponseSection } from './components/ResponseSection';
import { LoadingOverlay } from './components/LoadingOverlay';
import { ErrorNotification } from './components/ErrorNotification';
import './styles/App.scss';

const AppContent: React.FC = observer(() => {
    const { appStore, fileStore } = rootStore;

    const handleFileOpen = (filePath: string) => {
        appStore.sendMessage({ 
            type: 'openFile', 
            data: { filePath }
        });
    };

    useEffect(() => {
        // Инициализация - запрашиваем дерево файлов
        appStore.sendMessage({ type: 'getFiles' });

        // Слушаем сообщения от VS Code Extension
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            
            switch (message.type) {
                case 'fileTree':
                    fileStore.setFileTree(message.data);
                    break;
                case 'fileContent':
                    // Обработка содержимого файла будет в компоненте
                    break;
                case 'aiResponse':
                    rootStore.promptStore.setAiResponse(message.data);
                    break;
                case 'loadingStart':
                    appStore.setLoading(true);
                    rootStore.promptStore.setSubmitting(true);
                    break;
                case 'loadingEnd':
                    appStore.setLoading(false);
                    rootStore.promptStore.setSubmitting(false);
                    break;
                case 'error':
                    appStore.setError(message.data.message);
                    appStore.setLoading(false);
                    rootStore.promptStore.setSubmitting(false);
                    break;
            }
        };

        window.addEventListener('message', handleMessage);
        
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [appStore, fileStore]);

    return (
        <div className="app">
            <div className="app__container">
                {/* Левая панель - файлы */}
                <div className="app__sidebar">
                    <div className="app__section">
                        <h3 className="app__section-title">Файлы проекта</h3>
                        <FileTree onFileOpen={handleFileOpen} />
                    </div>
                </div>

                {/* Правая панель - AI взаимодействие */}
                <div className="app__main">
                    {/* Настройки API */}
                    <div className="app__section app__section--collapsible">
                        <ApiSettings />
                    </div>

                    {/* Менеджер шаблонов */}
                    <div className="app__section">
                        <TemplateManager />
                    </div>

                    {/* Секция ввода промпта */}
                    <div className="app__section">
                        <PromptSection />
                    </div>

                    {/* Выбранные файлы */}
                    <div className="app__section">
                        <SelectedFiles />
                    </div>

                    {/* Секция ответа */}
                    <div className="app__section">
                        <ResponseSection />
                    </div>
                </div>
            </div>

            {/* Оверлеи */}
            {appStore.isLoading && <LoadingOverlay />}
            {appStore.error && <ErrorNotification />}
        </div>
    );
});

const App: React.FC = () => {
    return (
        <StoreProvider store={rootStore}>
            <AppContent />
        </StoreProvider>
    );
};

export default App; 