// components/storage/MoveModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { storageApi, StorageFolder } from '../../api/storage';
import { StoragePermissions } from '../../api/utils/useStoragePermissions';
import './styles/MoveModal.css';

interface MoveModalProps {
    itemId: number;
    itemType: 'file' | 'folder';
    currentParentId: number | null;
    viewType: 'personal' | 'work';
    permissions: StoragePermissions;
    onMove: (targetFolderId: number | null) => Promise<void>;
    onClose: () => void;
}

interface FolderNode {
    folder: StorageFolder;
    children: FolderNode[];
    isExpanded: boolean;
}

const MoveModal: React.FC<MoveModalProps> = ({
    itemId,
    itemType,
    currentParentId,
    viewType,
    permissions,
    onMove,
    onClose,
}) => {
    const [rootFolders, setRootFolders] = useState<StorageFolder[]>([]);
    const [treeData, setTreeData] = useState<FolderNode[]>([]);
    const [selectedFolderId, setSelectedFolderId] = useState<number | null>(currentParentId);
    const [loading, setLoading] = useState(true);
    const [moving, setMoving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadRootFolders = async () => {
            try {
                setLoading(true);
                const folders = await storageApi.getFolders({
                    parent_id: 'root',
                    type: viewType,
                });
                setRootFolders(Array.isArray(folders) ? folders : []);
            } catch (err: any) {
                setError('Не удалось загрузить папки');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadRootFolders();
    }, [viewType]);

    useEffect(() => {
        const buildTree = (folders: StorageFolder[]): FolderNode[] => {
            return folders
                .filter(f => f.id !== itemId)
                .map(f => ({
                    folder: f,
                    children: [],
                    isExpanded: false,
                }));
        };
        setTreeData(buildTree(rootFolders));
    }, [rootFolders, itemId]);

    const toggleExpand = useCallback(async (node: FolderNode) => {
        if (!node.isExpanded && node.children.length === 0) {
            try {
                const subfolders = await storageApi.getFolders({
                    parent_id: node.folder.id,
                    type: viewType,
                });
                const childNodes = (Array.isArray(subfolders) ? subfolders : [])
                    .filter((f: StorageFolder) => f.id !== itemId)
                    .map((f: StorageFolder) => ({
                        folder: f,
                        children: [],
                        isExpanded: false,
                    }));
                node.children = childNodes;
            } catch (err) {
                console.error('Failed to load subfolders', err);
            }
        }
        node.isExpanded = !node.isExpanded;
        setTreeData([...treeData]);
    }, [treeData, viewType, itemId]);

    const handleSelect = (folderId: number | null) => {
        setSelectedFolderId(folderId);
    };

    const handleMove = async () => {
        if (selectedFolderId === undefined) return;
        setMoving(true);
        setError(null);
        try {
            await onMove(selectedFolderId);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Ошибка при перемещении');
        } finally {
            setMoving(false);
        }
    };

    const renderTree = (nodes: FolderNode[], level = 0) => {
        return nodes.map(node => (
            <div key={node.folder.id} className="mm-tree-item" style={{ marginLeft: level * 20 }}>
                <div
                    className={`mm-folder-row ${selectedFolderId === node.folder.id ? 'mm-folder-row--selected' : ''}`}
                    onClick={() => handleSelect(node.folder.id)}
                >
                    <span
                        className="mm-expand-icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(node);
                        }}
                    >
                        {node.children.length > 0 || node.folder.subfolders_count > 0 ? (
                            <i className={`fas fa-chevron-${node.isExpanded ? 'down' : 'right'}`} />
                        ) : (
                            <span style={{ width: 24, display: 'inline-block' }} />
                        )}
                    </span>
                    <i
                        className="fas fa-folder mm-folder-icon"
                        style={{ color: node.folder.color || '#3b82f6' }}
                    />
                    <span className="mm-folder-name">{node.folder.name}</span>
                </div>
                {node.isExpanded && renderTree(node.children, level + 1)}
            </div>
        ));
    };

    return (
        <div className="mm-overlay" onClick={onClose}>
            <div className="mm-container" onClick={e => e.stopPropagation()}>
                <div className="mm-header">
                    <h3>Выберите папку назначения</h3>
                    <button className="mm-close" onClick={onClose}>×</button>
                </div>
                <div className="mm-body">
                    {loading ? (
                        <div className="mm-loading">
                            <i className="fas fa-spinner fa-spin"></i>
                            <span>Загрузка папок...</span>
                        </div>
                    ) : error ? (
                        <div className="mm-error">{error}</div>
                    ) : (
                        <>
                            <div
                                className={`mm-folder-row mm-folder-row--root ${selectedFolderId === null ? 'mm-folder-row--selected' : ''}`}
                                onClick={() => handleSelect(null)}
                            >
                                <i className="fas fa-hdd" style={{ marginRight: 10, color: '#3b82f6' }} />
                                <span>Корень ({viewType === 'personal' ? 'Личное' : 'Рабочее'})</span>
                            </div>
                            <div className="mm-tree">
                                {renderTree(treeData)}
                            </div>
                        </>
                    )}
                </div>
                <div className="mm-footer">
                    <button className="mm-button mm-button--secondary" onClick={onClose} disabled={moving}>
                        Отмена
                    </button>
                    <button
                        className="mm-button mm-button--primary"
                        onClick={handleMove}
                        disabled={moving || selectedFolderId === undefined}
                    >
                        {moving ? (
                            <>
                                <i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }}></i>
                                Перемещение...
                            </>
                        ) : 'Переместить'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MoveModal;