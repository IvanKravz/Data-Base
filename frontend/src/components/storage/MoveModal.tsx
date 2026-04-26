// components/storage/MoveModal.tsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { storageApi, StorageFolder } from '../../api/storage';
import { StoragePermissions } from '../../api/utils/useStoragePermissions';
import { Folder, ChevronRight, ChevronDown, Database, Search, X } from 'lucide-react';
import './styles/MoveModal.css';

interface MoveModalProps {
    itemId: number;
    itemType: 'file' | 'folder';
    itemName: string;
    currentParentId: number | null;
    viewType: 'personal' | 'work';
    permissions: StoragePermissions;
    onMove: (itemId: number, targetFolderId: number | null, isFolder: boolean) => Promise<void>;
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
    itemName,
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
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

    const selectedRef = useRef(selectedFolderId);
    useEffect(() => {
        selectedRef.current = selectedFolderId;
    }, [selectedFolderId]);

    // Загрузка корневых папок
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

    // Построение начального дерева (без детей, только корневые папки)
    useEffect(() => {
        const initialTree = rootFolders
            .filter(f => f.id !== itemId)
            .map(f => ({
                folder: f,
                children: [],
                isExpanded: expandedIds.has(f.id),
            }));
        setTreeData(initialTree);
    }, [rootFolders, itemId]);

    // Загрузка дочерних папок (вызывается только при клике на шеврон)
    const loadChildren = useCallback(async (folderId: number) => {
        try {
            const subfolders = await storageApi.getFolders({
                parent_id: folderId,
                type: viewType,
            });
            const childNodes = (Array.isArray(subfolders) ? subfolders : [])
                .filter(f => f.id !== itemId)
                .map(f => ({
                    folder: f,
                    children: [],
                    isExpanded: expandedIds.has(f.id),
                }));

            // Обновляем дерево: находим нужную папку и подставляем children
            setTreeData(prevTree => {
                const updateNode = (nodes: FolderNode[]): FolderNode[] => {
                    return nodes.map(node => {
                        if (node.folder.id === folderId) {
                            return { ...node, children: childNodes, isExpanded: true };
                        }
                        if (node.children.length) {
                            return { ...node, children: updateNode(node.children) };
                        }
                        return node;
                    });
                };
                return updateNode(prevTree);
            });

            // Добавляем ID в expandedIds, чтобы сохранить состояние при последующих ререндерах
            setExpandedIds(prev => new Set(prev).add(folderId));
        } catch (err) {
            console.error('Failed to load subfolders', err);
        }
    }, [viewType, itemId, expandedIds]);

    // Переключение раскрытия папки
    const toggleExpand = useCallback(async (folderId: number, isExpanded: boolean, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isExpanded) {
            await loadChildren(folderId);
        } else {
            setTreeData(prevTree => {
                const closeNode = (nodes: FolderNode[]): FolderNode[] => {
                    return nodes.map(node => {
                        if (node.folder.id === folderId) {
                            return { ...node, isExpanded: false };
                        }
                        if (node.children.length) {
                            return { ...node, children: closeNode(node.children) };
                        }
                        return node;
                    });
                };
                return closeNode(prevTree);
            });
            setExpandedIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(folderId);
                return newSet;
            });
        }
    }, [loadChildren]);

    // Фильтрация по поиску
    const filterTree = useCallback((nodes: FolderNode[], query: string): FolderNode[] => {
        if (!query.trim()) return nodes;
        const lowerQuery = query.toLowerCase();
        return nodes.reduce<FolderNode[]>((acc, node) => {
            const matches = node.folder.name.toLowerCase().includes(lowerQuery);
            const filteredChildren = filterTree(node.children, query);
            if (matches || filteredChildren.length > 0) {
                acc.push({
                    ...node,
                    children: filteredChildren,
                    isExpanded: filteredChildren.length > 0 ? true : node.isExpanded,
                });
            }
            return acc;
        }, []);
    }, []);

    const displayedTree = useMemo(() => filterTree(treeData, searchQuery), [treeData, searchQuery, filterTree]);

    // Валидация перемещения папки
    const isInvalidMove = useCallback(async (): Promise<boolean> => {
        if (itemType !== 'folder') return false;
        if (selectedFolderId === null) return false;
        if (selectedFolderId === itemId) return true;

        const isDescendant = async (parentId: number, targetId: number): Promise<boolean> => {
            if (parentId === targetId) return true;
            try {
                const children = await storageApi.getFolders({ parent_id: parentId, type: viewType });
                for (const child of children) {
                    if (child.id === targetId) return true;
                    const deeper = await isDescendant(child.id, targetId);
                    if (deeper) return true;
                }
                return false;
            } catch {
                return false;
            }
        };
        return await isDescendant(itemId, selectedFolderId);
    }, [itemType, itemId, selectedFolderId, viewType]);

    const [moveDisabled, setMoveDisabled] = useState(false);
    const [disableReason, setDisableReason] = useState<string | null>(null);

    useEffect(() => {
        const check = async () => {
            if (selectedFolderId === currentParentId) {
                setMoveDisabled(true);
                setDisableReason('Папка уже находится в выбранном месте');
                return;
            }
            const invalid = await isInvalidMove();
            if (invalid) {
                setMoveDisabled(true);
                setDisableReason('Нельзя переместить папку в саму себя или её подпапку');
            } else {
                setMoveDisabled(false);
                setDisableReason(null);
            }
        };
        check();
    }, [selectedFolderId, currentParentId, isInvalidMove]);

    const handleMove = async () => {
        if (moveDisabled) return;
        setMoving(true);
        setError(null);
        try {
            await onMove(selectedFolderId, itemId, itemType === 'folder');
            onClose();
        } catch (err: any) {
            setError(err.message || 'Ошибка при перемещении');
        } finally {
            setMoving(false);
        }
    };

    // Рендер узлов дерева – без лишних обёрток, чтобы дети не обрезались
    const renderTreeLevel = (nodes: FolderNode[]): React.ReactNode => {
        // Разворачиваем массив для порядка "снизу вверх"
        const reversed = [...nodes].reverse();
        return reversed.map(node => {
            const hasSubfolders = (node.children.length > 0 || (node.folder.subfolders_count ?? 0) > 0);
            const subfoldersCount = node.folder.subfolders_count ?? 0;
            const filesCount = node.folder.files_count ?? 0;

            return (
                <div key={node.folder.id} className="mm-tree-node">
                    <div className="mm-folder-card">
                        <div
                            className={`mm-folder-card__inner ${selectedFolderId === node.folder.id ? 'mm-folder-card__inner--selected' : ''}`}
                            onClick={() => setSelectedFolderId(node.folder.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && setSelectedFolderId(node.folder.id)}
                        >
                            <div className="mm-folder-card__icon">
                                <Folder size={28} strokeWidth={1.5} fill={node.folder.color ? `${node.folder.color}20` : '#eff6ff'} color={node.folder.color || '#3b82f6'} />
                            </div>
                            <div className="mm-folder-card__name">{node.folder.name}</div>
                            <div className="mm-folder-card__stats">
                                {subfoldersCount > 0 && (
                                    <span className="mm-folder-stats__item" title="Вложенных папок">
                                        📁 {subfoldersCount}
                                    </span>
                                )}
                                {filesCount > 0 && (
                                    <span className="mm-folder-stats__item" title="Файлов">
                                        📄 {filesCount}
                                    </span>
                                )}
                            </div>
                        </div>
                        {hasSubfolders && (
                            <button
                                className="mm-folder-card__expand"
                                onClick={(e) => toggleExpand(node.folder.id, node.isExpanded, e)}
                                aria-label={node.isExpanded ? 'Свернуть' : 'Развернуть'}
                            >
                                {node.isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                        )}
                    </div>
                    {node.isExpanded && node.children.length > 0 && (
                        <div className="mm-children-wrapper">
                            {renderTreeLevel(node.children)}
                        </div>
                    )}
                </div>
            );
        });
    };

    return (
        <div className="mm-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="mm-container" onClick={e => e.stopPropagation()}>
                <div className="mm-header">
                    <h3>
                        Переместить {itemType === 'folder' ? 'папку ' : 'файл '}
                        <span className="mm-header-item-name" title={itemName}> "{itemName}"</span>
                    </h3>
                    <button className="mm-close" onClick={onClose} aria-label="Закрыть">
                        <X size={20} />
                    </button>
                </div>

                <div className="mm-body">
                    {loading ? (
                        <div className="mm-skeleton">
                            <div className="mm-skeleton-line"></div>
                            <div className="mm-skeleton-line"></div>
                            <div className="mm-skeleton-line"></div>
                        </div>
                    ) : error ? (
                        <div className="mm-error">{error}</div>
                    ) : (
                        <>
                            <div className="mm-search">
                                <Search size={16} className="mm-search-icon" />
                                <input
                                    type="text"
                                    placeholder="Поиск папок..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="mm-search-input"
                                />
                            </div>

                            <div className="mm-tree-grid">
                                {/* Корневая папка (корень хранилища) */}
                                <div className="mm-folder-card mm-folder-card--root">
                                    <div
                                        className={`mm-folder-card__inner ${selectedFolderId === null ? 'mm-folder-card__inner--selected' : ''}`}
                                        onClick={() => setSelectedFolderId(null)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => e.key === 'Enter' && setSelectedFolderId(null)}
                                    >
                                        <div className="mm-folder-card__icon">
                                            <Database size={28} strokeWidth={1.5} color="#3b82f6" />
                                        </div>
                                        <div className="mm-folder-card__name">
                                            Корень ({viewType === 'personal' ? 'Личное' : 'Рабочее'})
                                        </div>
                                    </div>
                                </div>

                                {displayedTree.length === 0 && searchQuery && (
                                    <div className="mm-no-results">Ничего не найдено</div>
                                )}
                                {renderTreeLevel(displayedTree)}
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
                        disabled={moving || moveDisabled}
                        title={disableReason || ''}
                    >
                        {moving ? 'Перемещение...' : 'Переместить'}
                    </button>
                </div>
                {disableReason && !moving && (
                    <div className="mm-validation-hint">{disableReason}</div>
                )}
            </div>
        </div>
    );
};

export default MoveModal;