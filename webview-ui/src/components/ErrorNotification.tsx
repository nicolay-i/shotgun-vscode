import React from 'react';
import { observer } from 'mobx-react-lite';
import { X } from 'phosphor-react';
import { useAppStore } from '../contexts/StoreContext';
import './ErrorNotification.scss';

export const ErrorNotification: React.FC = observer(() => {
    const appStore = useAppStore();

    if (!appStore.error) {
        return null;
    }

    const handleClose = () => {
        appStore.clearError();
    };

    return (
        <div className="error-notification">
            <div className="error-notification__content">
                <div className="error-notification__icon">⚠️</div>
                <div className="error-notification__message">
                    {appStore.error}
                </div>
                <button 
                    className="error-notification__close"
                    onClick={handleClose}
                    title="Закрыть"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}); 