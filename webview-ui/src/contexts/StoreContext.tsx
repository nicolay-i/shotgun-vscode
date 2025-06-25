import React, { createContext, useContext } from 'react';
import { RootStore } from '../stores/RootStore';

const StoreContext = createContext<RootStore | null>(null);

export const StoreProvider: React.FC<{
    store: RootStore;
    children: React.ReactNode;
}> = ({ store, children }) => {
    return (
        <StoreContext.Provider value={store}>
            {children}
        </StoreContext.Provider>
    );
};

export const useStores = (): RootStore => {
    const context = useContext(StoreContext);
    if (context === null) {
        throw new Error('useStores must be used within a StoreProvider');
    }
    return context;
};

// Удобные хуки для отдельных stores
export const useAppStore = () => useStores().appStore;
export const useFileStore = () => useStores().fileStore;
export const useApiStore = () => useStores().apiStore;
export const useTemplateStore = () => useStores().templateStore;
export const usePromptStore = () => useStores().promptStore; 