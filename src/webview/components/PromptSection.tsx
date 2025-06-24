import React from 'react';

interface PromptSectionProps {
    prompt: string;
    onPromptChange: (prompt: string) => void;
}

const PromptSection: React.FC<PromptSectionProps> = ({ prompt, onPromptChange }) => {
    return (
        <div className="input-section">
            <label htmlFor="prompt">Введите ваш запрос:</label>
            <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => onPromptChange(e.target.value)}
                placeholder="Опишите что вы хотите узнать о коде..."
            />
        </div>
    );
};

export default PromptSection; 