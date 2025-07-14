import React from 'react';
import { Trash2 } from 'lucide-react';
import { CommunicationPost } from '../../../../../types';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { communicationPostsApi } from '../../../../../api';
import './CommunicationPosts.css';

interface CommunicationPostsListProps {
  posts: CommunicationPost[];
  onPostDeleted: (deletedId: string) => void;
}

export function CommunicationPostsList({ posts, onPostDeleted }: CommunicationPostsListProps) {
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [postToDelete, setPostToDelete] = React.useState<string | null>(null);

  const handleDelete = (id: string) => {
    setPostToDelete(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    console.log('postToDelete', postToDelete)
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
                <div>
                  <div className="communication-post-description">{post.description}</div>
                </div>
                <div className="communication-post-details">
                  {post.division && <p>Подразделение: {post.division}</p>}
                  {post.subdivision && (
                    <p>Отделение: {post.subdivision}</p>
                  )}
                </div>
              </div>
            ))}
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
    </div>
  );
}