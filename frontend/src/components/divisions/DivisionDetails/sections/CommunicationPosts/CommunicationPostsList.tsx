// CommunicationPostsList.tsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Trash2, Building, ChevronDown, ChevronRight, Pencil } from 'lucide-react';
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
  const [tooltip, setTooltip] = useState({ show: false, content: '', x: 0, y: 0 });
  const [expandedDivisions, setExpandedDivisions] = useState<Set<string>>(new Set());
  const descriptionRefs = useRef<{ [key: string]: HTMLParagraphElement | null }>({});

  const user = useSelector((state: RootState) => state.auth.user);
  const permissions = user?.permissions;
  const canDeletePosts = useMemo(() => permissions?.models?.CommunicationPost?.includes('delete') ?? false, [permissions]);
  const canEditPosts = useMemo(() => permissions?.models?.CommunicationPost?.includes('change') ?? false, [permissions]);

  const filteredPosts = useMemo(() => {
    if (!searchTerm.trim()) return posts;
    const normalizedSearch = normalizeSearchString(searchTerm);
    return posts.filter(post => normalizeSearchString(post.name).includes(normalizedSearch));
  }, [posts, searchTerm]);

  const groupedPosts = useMemo(() => {
    if (isGlobalView) {
      return filteredPosts.reduce((acc, post) => {
        const divisionName = post.division_name || 'Без подразделения';
        if (!acc[divisionName]) acc[divisionName] = [];
        acc[divisionName].push(post);
        return acc;
      }, {} as Record<string, CommunicationPost[]>);
    }
    return { 'Все посты': filteredPosts };
  }, [isGlobalView, filteredPosts]);

  const divisionNames = useMemo(() => Object.keys(groupedPosts).sort(), [groupedPosts]);

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

  const toggleDivision = (divisionName: string) => {
    setExpandedDivisions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(divisionName)) newSet.delete(divisionName);
      else newSet.add(divisionName);
      return newSet;
    });
  };

  const checkTextOverflow = (element: HTMLParagraphElement) => {
    if (element) return element.scrollHeight > element.clientHeight || element.offsetWidth < element.scrollWidth;
    return false;
  };

  const handleDescriptionMouseEnter = (postId: string, content: string, event: React.MouseEvent) => {
    const element = descriptionRefs.current[postId];
    if (element && checkTextOverflow(element)) {
      setTooltip({
        show: true,
        content,
        x: event.clientX + 15,
        y: event.clientY - 15
      });
    }
  };

  const handleDescriptionMouseLeave = () => {
    setTooltip({ show: false, content: '', x: 0, y: 0 });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (tooltip.show) {
        setTooltip(prev => ({ ...prev, x: e.clientX + 15, y: e.clientY - 15 }));
      }
    };
    if (tooltip.show) document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [tooltip.show]);

  useEffect(() => {
    if (isGlobalView && divisionNames.length > 0) {
      setExpandedDivisions(new Set(divisionNames));
    }
  }, [isGlobalView, divisionNames]);

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
          {posts.length !== filteredPosts.length && <span> из {posts.length}</span>}
        </div>
      )}

      <div className="communication-posts-content">
        {divisionNames.map(divisionName => {
          const postsInDivision = groupedPosts[divisionName];
          const isExpanded = !isGlobalView || expandedDivisions.has(divisionName);

          return (
            <div key={divisionName} className="division-group">
              {isGlobalView && (
                <button className="division-post-header" onClick={() => toggleDivision(divisionName)}>
                  <div className="division-toggle">
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <span className="division-title">{divisionName} ({postsInDivision.length})</span>
                  </div>
                </button>
              )}

              {(isExpanded || !isGlobalView) && (
                <div className="communication-posts-grid">
                  {postsInDivision.map(post => (
                    <div key={post.id} className="communication-post-card">
                      <div className="communication-post-header">
                        <h3 className="communication-post-title">{post.name}</h3>
                        <div className="communication-post-actions">
                          {canEditPosts && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleEdit(post.id); }}
                              className="communication-post-edit-btn"
                              aria-label="Редактировать пост связи"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                          {canDeletePosts && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(post.id); }}
                              className="communication-post-delete-btn"
                              aria-label="Удалить пост связи"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="communication-post-content">
                        <p
                          ref={el => (descriptionRefs.current[post.id] = el)}
                          className="communication-post-description"
                          onMouseEnter={(e) => handleDescriptionMouseEnter(post.id, post.description || 'Описание отсутствует', e)}
                          onMouseLeave={handleDescriptionMouseLeave}
                        >
                          {post.description || 'Описание отсутствует'}
                        </p>

                        <div className="communication-post-meta">
                          {post.division_name && (
                            <div className="communication-post-meta-item">
                              <Building className="communication-post-meta-icon" />
                              <span className="communication-post-division">{post.division_name}</span>
                            </div>
                          )}
                          {post.subdivision_name && (
                            <div className="communication-post-meta-item">
                              <span className="communication-post-subdivision">{post.subdivision_name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {tooltip.show && (
        <div
          className="communication-post-tooltip"
          style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
        >
          {tooltip.content}
        </div>
      )}

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