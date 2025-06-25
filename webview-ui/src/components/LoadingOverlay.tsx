import React from 'react';
import { observer } from 'mobx-react-lite';
import { useAppStore } from '../contexts/StoreContext';
import './LoadingOverlay.scss';

export const LoadingOverlay: React.FC = observer(() => {
    const appStore = useAppStore();

    if (!appStore.isLoading) {
        return null;
    }

    return (
        <div className="loading-overlay">
            <div className="loading-overlay__content">
                <div className="loading-spinner"></div>
                <p className="loading-overlay__text">
                    Обработка запроса...
                </p>
            </div>
        </div>
    );
}); 