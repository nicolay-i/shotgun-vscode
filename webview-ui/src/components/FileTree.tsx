import React from 'react';
import { observer } from 'mobx-react-lite';
import { useFileStore } from '../contexts/StoreContext';

export const FileTree: React.FC = observer(() => {
    const fileStore = useFileStore();

    return (
        <div className="file-tree">
            <div className="app__section-content">
                {fileStore.fileTree.length === 0 ? (
                    <p className="text-small">Загрузка файлов...</p>
                ) : (
                    <p className="text-small">
                        Найдено файлов: {fileStore.fileTree.length}
                    </p>
                )}
            </div>
        </div>
    );
}); 