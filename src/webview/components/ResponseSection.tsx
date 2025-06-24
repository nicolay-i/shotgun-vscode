import React from 'react';
import { FloppyDisk } from 'phosphor-react';

interface ResponseSectionProps {
    response: string;
    onSave: () => void;
}

const ResponseSection: React.FC<ResponseSectionProps> = ({ response, onSave }) => {
    return (
        <div className="response-section">
            <div className="response-header">
                <h4>💬 Ответ AI</h4>
                {response && (
                    <button onClick={onSave} className="save-btn">
                        <FloppyDisk size={12} />
                        Сохранить
                    </button>
                )}
            </div>
            <div className="response-content">
                {response && (
                    <pre>{response}</pre>
                )}
            </div>
        </div>
    );
};

export default ResponseSection; 