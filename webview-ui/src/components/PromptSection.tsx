import React from 'react';
import { observer } from 'mobx-react-lite';

export const PromptSection: React.FC = observer(() => {
    return (
        <div className="prompt-section">
            <h3 className="app__section-title">Ваш запрос</h3>
            <div className="app__section-content">
                <textarea 
                    className="form-group__input form-group__input--textarea"
                    placeholder="Введите ваш запрос..."
                />
            </div>
        </div>
    );
}); 