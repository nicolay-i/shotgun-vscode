import React from 'react';
import { observer } from 'mobx-react-lite';

export const TemplateManager: React.FC = observer(() => {
    return (
        <div className="template-manager">
            <h3 className="app__section-title">Шаблоны промптов</h3>
            <div className="app__section-content">
                <p className="text-small">Менеджер шаблонов будет здесь</p>
            </div>
        </div>
    );
}); 