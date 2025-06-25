import React from 'react';
import { observer } from 'mobx-react-lite';

export const ResponseSection: React.FC = observer(() => {
    return (
        <div className="response-section">
            <h3 className="app__section-title">Ответ AI</h3>
            <div className="app__section-content">
                <p className="text-small">Ответ от AI будет здесь</p>
            </div>
        </div>
    );
}); 