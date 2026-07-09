import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Trash2, Building, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../store/store';
import { CommunicationPost } from '../../../../../types';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { EditCommunicationPostForm } from './EditCommunicationPostForm';
import { communicationPostsApi } from '../../../../../api';
import { normalizeSearchString } from '../../../../../utils/normalizeSearchString';
import './CommunicationPosts.css';

interface CommunicationPostsListProps {
  posts: CommunicationPost[];
  onPostDeleted: (deletedId: string) => void;
  onPostUpdated?: () => void;
  isGlobalView?: boolean;
  searchTerm?: string;
}

export function CommunicationPostsList({
  posts,
  onPostDeleted,
  onPostUpdated,
  isGlobalView = false,
  searchTerm = '',
}: CommunicationPostsListProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>(''); // теперь без 'all'
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});

  const tabsRef = useRef<HTMLDivElement>(null);

  const user = useSelector((state: RootState) => state.auth.user);
  const permissions = user?.permissions;
  const canDeletePosts = useMemo(
    () => permissions?.models?.CommunicationPost?.includes('delete') ?? false,
    [permissions]
  );
  const canEditPosts = useMemo(
    () => permissions?.models?.CommunicationPost?.includes('change') ?? false,
    [permissions]
  );

  const filteredPosts = useMemo(() => {
    if (!searchTerm.trim()) return posts;
    const normalizedSearch = normalizeSearchString(searchTerm);
    return posts.filter(post =>
      normalizeSearchString(post.name).includes(normalizedSearch)
    );
  }, [posts, searchTerm]);

  // Вкладки подразделений (без "Все")
  const divisionTabs = useMemo(() => {
    if (!isGlobalView) return [];
    const divisions = new Set(
      filteredPosts.map(p => p.division_name || 'Без подразделения')
    );
    return Array.from(divisions).sort();
  }, [isGlobalView, filteredPosts]);

  // Устанавливаем активную вкладку на первое подразделение при инициализации
  useEffect(() => {
    if (divisionTabs.length > 0 && !activeTab) {
      setActiveTab(divisionTabs[0]);
    }
  }, [divisionTabs, activeTab]);

  // Фильтруем посты по активной вкладке
  const visiblePosts = useMemo(() => {
    if (!isGlobalView) return filteredPosts;
    return filteredPosts.filter(
      p => (p.division_name || 'Без подразделения') === activeTab
    );
  }, [isGlobalView, activeTab, filteredPosts]);

  // Позиционирование индикатора
  useEffect(() => {
    if (!tabsRef.current || !isGlobalView || !activeTab) return;
    const activeButton = tabsRef.current.querySelector('.communication-tab--active') as HTMLElement;
    if (activeButton) {
      const { offsetLeft, offsetWidth } = activeButton;
      setIndicatorStyle({ left: offsetLeft, width: offsetWidth });
    }
  }, [activeTab, divisionTabs, isGlobalView]);

  const toggleExpand = (postId: string) => {
    setExpandedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleDelete = (id: string) => {
    setPostToDelete(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (postToDelete) {
      try {
        const token = localStorage.getItem('accessToken');
        await communicationPostsApi.deleteCommunicationPost(postToDelete, token);
        onPostDeleted(postToDelete);
      } catch (error) {
        console.error('Ошибка при удалении поста связи:', error);
      } finally {
        setShowDeleteModal(false);
        setPostToDelete(null);
      }
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setPostToDelete(null);
  };

  const handleEdit = (id: string) => {
    setEditingPostId(id);
  };

  const handleEditClose = () => {
    setEditingPostId(null);
  };

  const handleEditSaved = () => {
    if (onPostUpdated) onPostUpdated();
  };

  if (filteredPosts.length === 0) {
    return (
      <div className="communication-posts-container">
        <div className="communication-posts-content">
          <div className="communication-posts-empty-message">
            {searchTerm.trim()
              ? `Посты связи по запросу "${searchTerm}" не найдены`
              : 'Нет постов связи для отображения'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="communication-posts-container">
      {searchTerm.trim() && (
        <div className="search-results-info">
          Найдено постов связи: {filteredPosts.length}
          {posts.length !== filteredPosts.length && (
            <span> из {posts.length}</span>
          )}
        </div>
      )}

      {isGlobalView && divisionTabs.length > 0 && (
        <div className="communication-tabs" ref={tabsRef}>
          {divisionTabs.map(tab => (
            <button
              key={tab}
              className={`communication-tab ${activeTab === tab ? 'communication-tab--active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab} ({filteredPosts.filter(p => (p.division_name || 'Без подразделения') === tab).length})
            </button>
          ))}
          <div
            className="communication-tabs-indicator"
            style={{
              left: `${indicatorStyle.left}px`,
              width: `${indicatorStyle.width}px`,
            }}
          />
        </div>
      )}

      <div className="communication-posts-content">
        {visiblePosts.length === 0 ? (
          <div className="communication-posts-empty-message">
            Нет постов для выбранного подразделения
          </div>
        ) : (
          <div className="communication-posts-mini-grid">
            {visiblePosts.map(post => {
              const isExpanded = !!expandedPosts[post.id];
              return (
                <div
                  key={post.id}
                  className={`mini-post-card ${isExpanded ? 'mini-post-card--expanded' : ''}`}
                >
                  <div className="mini-post-card__content">
                    <div
                      className="mini-post-card__title-row"
                      onClick={() => toggleExpand(post.id)}
                    >
                      <h3 className="mini-post-card__title">{post.name}</h3>
                      <div className="mini-post-card__right-group">
                        <div className="mini-post-card__actions">
                          <span
                            className="mini-post-card__chevron"
                            onClick={e => {
                              e.stopPropagation();
                              toggleExpand(post.id);
                            }}
                          >
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </span>
                          {canEditPosts && (
                            <button
                              className="mini-post-card__action-btn"
                              onClick={e => {
                                e.stopPropagation();
                                handleEdit(post.id);
                              }}
                              aria-label="Редактировать пост связи"
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                          {canDeletePosts && (
                            <button
                              className="mini-post-card__action-btn"
                              onClick={e => {
                                e.stopPropagation();
                                handleDelete(post.id);
                              }}
                              aria-label="Удалить пост связи"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`mini-post-card__body ${
                        isExpanded ? 'mini-post-card__body--expanded' : ''
                      }`}
                    >
                      <p className="mini-post-card__description">
                        {post.description || 'Описание отсутствует'}
                      </p>
                      <div className="mini-post-card__meta">
                        <Building size={14} />
                        <span>{post.subdivision_name || post.division_name}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showDeleteModal && (
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          title="Удаление поста связи"
          message="Вы уверены, что хотите удалить этот пост связи?"
        />
      )}

      {editingPostId && (
        <EditCommunicationPostForm
          postId={editingPostId}
          onClose={handleEditClose}
          onSaved={handleEditSaved}
        />
      )}
    </div>
  );
}