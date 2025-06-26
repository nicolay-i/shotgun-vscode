import React from 'react';
import { observer } from 'mobx-react-lite';
import { useFileStore } from '../contexts/StoreContext';
import { X, File } from 'phosphor-react';

export const SelectedFiles: React.FC = observer(() => {
    const fileStore = useFileStore();
    const selectedFiles = fileStore.selectedFilesList;

    if (selectedFiles.length === 0) {
        return (
            <div className="selected-files">
                <h3 className="app__section-title">Выбранные файлы</h3>
                <div className="selected-files__empty">
                    <p className="text-small">Выберите файлы в дереве для анализа</p>
                </div>
            </div>
        );
    }

    return (
        <div className="selected-files">
            <h3 className="app__section-title">
                Выбранные файлы ({selectedFiles.length})
            </h3>
            <div className="selected-files__list">
                {selectedFiles.map((file) => (
                    <div key={file.path} className="selected-file">
                        <div className="selected-file__content">
                            <File size={16} className="selected-file__icon" />
                            <span className="selected-file__path" title={file.path}>
                                {file.path}
                            </span>
                        </div>
                        <button
                            className="selected-file__remove"
                            onClick={() => fileStore.unselectFile(file.path)}
                            title="Убрать файл из выбора"
                            aria-label="Убрать файл из выбора"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}); 