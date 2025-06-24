import React from 'react';
import { File, X } from 'phosphor-react';

interface SelectedFilesProps {
    selectedFiles: Map<string, string>;
    onFileRemove: (filePath: string) => void;
}

const SelectedFiles: React.FC<SelectedFilesProps> = ({ selectedFiles, onFileRemove }) => {
    return (
        <div className="selected-files">
            <h4>
                📄 Выбранные файлы <span className="file-count">({selectedFiles.size})</span>:
            </h4>
            <div className="selected-files-list">
                {Array.from(selectedFiles.keys()).map((path) => (
                    <div key={path} className="selected-file">
                        <span className="file-name">
                            <File size={16} />
                            {path}
                        </span>
                        <button 
                            onClick={() => onFileRemove(path)}
                            className="remove-btn"
                            title="Удалить файл"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SelectedFiles; 