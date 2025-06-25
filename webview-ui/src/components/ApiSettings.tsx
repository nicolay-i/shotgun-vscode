import React from 'react';
import { observer } from 'mobx-react-lite';

export const ApiSettings: React.FC = observer(() => {
    return (
        <div className="api-settings">
            <h3 className="app__section-title">Настройки API</h3>
            <div className="app__section-content">
                <p className="text-small">Настройки API будут здесь</p>
            </div>
        </div>
    );
}); 