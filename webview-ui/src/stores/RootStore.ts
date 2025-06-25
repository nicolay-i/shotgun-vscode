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
        this.appStore = new AppStore();
        this.fileStore = new FileStore();
        this.apiStore = new ApiStore();
        this.templateStore = new TemplateStore();
        this.promptStore = new PromptStore();
    }
}

export const rootStore = new RootStore(); 