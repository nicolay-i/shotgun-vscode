import React from 'react';
import { Spinner } from 'phosphor-react';

const LoadingOverlay: React.FC = () => {
    return (
        <div className="loading">
            <div className="loading-content">
                <Spinner size={24} className="spinner" />
                <p>Обработка запроса...</p>
            </div>
        </div>
    );
};

export default LoadingOverlay; 