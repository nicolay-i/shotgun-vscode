import { AppStore } from './AppStore';
import { FileStore } from './FileStore';
import { ApiStore } from './ApiStore';
import { TemplateStore } from './TemplateStore';
import { PromptStore } from './PromptStore';

export class RootStore {
    appStore: AppStore;
    fileStore: FileStore;
    apiStore: ApiStore;
    templateStore: TemplateStore;
    promptStore: PromptStore;

    constructor() {
        console.log('[RootStore] Инициализация RootStore...');
        
        this.appStore = new AppStore();
        this.fileStore = new FileStore(this.appStore);
        this.apiStore = new ApiStore();
        this.templateStore = new TemplateStore();
        this.promptStore = new PromptStore();
        
        // Устанавливаем ссылку на AppStore в ApiStore
        this.apiStore.setAppStore(this.appStore);
        
        console.log('[RootStore] RootStore инициализирован');
    }
}

export const rootStore = new RootStore(); 