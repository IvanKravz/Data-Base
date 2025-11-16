// CommunicationPostsList.tsx - исправленная версия
import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Building, Users } from 'lucide-react';
import { CommunicationPost } from '../../../../../types';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { communicationPostsApi } from '../../../../../api';
import './CommunicationPosts.css';

interface CommunicationPostsListProps {
  posts: CommunicationPost[];
  onPostDeleted: (deletedId: string) => void;
}

export function CommunicationPostsList({ posts, onPostDeleted }: CommunicationPostsListProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState({ show: false, content: '', x: 0, y: 0 });
  const descriptionRefs = useRef<{ [key: string]: HTMLParagraphElement | null }>({});

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

  const checkTextOverflow = (element: HTMLParagraphElement) => {
    if (element) {
      // Проверяем обрезку текста через сравнение scrollHeight и clientHeight
      // или через проверку наличия многоточия
      const isOverflowing = element.scrollHeight > element.clientHeight;
      const hasEllipsis = element.offsetWidth < element.scrollWidth;
      return isOverflowing || hasEllipsis;
    }
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
        setTooltip(prev => ({
          ...prev,
          x: e.clientX + 15,
          y: e.clientY - 15
        }));
      }
    };

    if (tooltip.show) {
      document.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [tooltip.show]);

  return (
    <div className="communication-posts-container">
      <div className="communication-posts-content">
        {posts.length === 0 ? (
          <div className="communication-posts-empty-message">
            Нет постов связи для отображения
          </div>
        ) : (
          <div className="communication-posts-grid">
            {posts.map(post => (
              <div key={post.id} className="communication-post-card">
                <div className="communication-post-header">
                  <h3 className="communication-post-title">{post.name}</h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(post.id);
                    }}
                    className="communication-post-delete-btn"
                    aria-label="Удалить пост связи"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="communication-post-content">
                  <p 
                    ref={el => descriptionRefs.current[post.id] = el}
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
                        <span className="communication-post-division">
                          {post.division_name}
                        </span>
                      </div>
                    )}
                    {post.subdivision_name && (
                      <div className="communication-post-meta-item">
                        <Users className="communication-post-meta-icon" />
                        <span className="communication-post-subdivision">
                          {post.subdivision_name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {tooltip.show && (
        <div 
          className="communication-post-tooltip"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
          }}
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
    </div>
  );
}