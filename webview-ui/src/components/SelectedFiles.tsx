import React from 'react';
import { observer } from 'mobx-react-lite';

export const SelectedFiles: React.FC = observer(() => {
    return (
        <div className="selected-files">
            <h3 className="app__section-title">Выбранные файлы</h3>
            <div className="app__section-content">
                <p className="text-small">Выбранные файлы будут здесь</p>
            </div>
        </div>
    );
}); 