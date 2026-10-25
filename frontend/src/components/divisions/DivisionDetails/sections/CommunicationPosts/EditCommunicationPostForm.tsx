// components/divisions/DivisionDetails/sections/CommunicationPosts/EditCommunicationPostForm.tsx
import React, { useEffect, useState } from 'react';
import { X, Check, Lock, Trash2, CornerDownRight } from 'lucide-react';
import { communicationPostsApi } from '../../../../../api';
import type { CommunicationPost, CommunicationPostKind } from '../../../../../types';
import { getKindMeta } from './communicationPostKind';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { PostSelect } from './PostSelect';
import {
  loadFacilitiesForDivision,
  setFacilityPostLink,
  findFacilityForPost,
  type FacilityOption,
} from './postFacilityHelpers';
import './styles/CommunicationPosts.css';

interface EditCommunicationPostFormProps {
  postId: string;
  onClose: () => void;
  onSaved: () => void;
}

export function EditCommunicationPostForm({
  postId,
  onClose,
  onSaved,
}: EditCommunicationPostFormProps) {
  const token = localStorage.getItem('accessToken') || '';

  const [post, setPost] = useState<CommunicationPost | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [facilities, setFacilities] = useState<FacilityOption[]>([]);
  const [facilitiesLoading, setFacilitiesLoading] = useState(false);
  const [originalFacilityId, setOriginalFacilityId] = useState<string>('');
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('');

  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const data = await communicationPostsApi.getCommunicationPost(postId, token);
        setPost(data);
        setName(data.name);
        setDescription(data.description || '');
      } catch (err) {
        console.error(err);
        setError('Не удалось загрузить данные поста');
      } finally {
        setInitialLoading(false);
      }
    };
    fetchPost();
  }, [postId, token]);

  useEffect(() => {
    if (!post) return;
    if (post.parent) {
      setFacilities([]);
      setOriginalFacilityId('');
      setSelectedFacilityId('');
      return;
    }

    let cancelled = false;
    setFacilitiesLoading(true);
    loadFacilitiesForDivision(
      token,
      String(post.division),
      post.subdivision ? String(post.subdivision) : null,
    )
      .then(list => {
        if (cancelled) return;
        setFacilities(list);
        const found = findFacilityForPost(list, String(post.id));
        setOriginalFacilityId(found?.id || '');
        setSelectedFacilityId(found?.id || '');
      })
      .catch(e => {
        if (cancelled) return;
        console.error(e);
        setFacilities([]);
      })
      .finally(() => { if (!cancelled) setFacilitiesLoading(false); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.id, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;
    setLoading(true);
    setError('');

    if (!name.trim()) { setError('Введите название'); setLoading(false); return; }

    const payload = {
      name: name.trim(),
      kind: post.kind as CommunicationPostKind,
      parent: post.parent?.id ? parseInt(String(post.parent.id), 10) : null,
      division: parseInt(String(post.division), 10),
      subdivision: post.subdivision ? parseInt(String(post.subdivision), 10) : null,
      description: description.trim() || undefined,
    };

    try {
      await communicationPostsApi.updateCommunicationPost(postId, payload, token);

      if (!post.parent && originalFacilityId !== selectedFacilityId) {
        if (originalFacilityId) {
          const original = facilities.find(f => f.id === originalFacilityId);
          if (original) {
            try {
              await setFacilityPostLink(
                token, originalFacilityId, String(post.id), 'remove', original.postIds,
              );
            } catch (unlinkErr) {
              console.error('Failed to unlink post from old facility:', unlinkErr);
            }
          }
        }
        if (selectedFacilityId) {
          const next = facilities.find(f => f.id === selectedFacilityId);
          if (next) {
            try {
              await setFacilityPostLink(
                token, selectedFacilityId, String(post.id), 'add', next.postIds,
              );
            } catch (linkErr) {
              console.error('Failed to link post to facility:', linkErr);
            }
          }
        }
      }

      onSaved();
      onClose();
    } catch (err: any) {
      const data = err?.response?.data;
      let msg = 'Не удалось обновить пост связи';
      if (data && typeof data === 'object') {
        if (data.detail) msg = data.detail;
        else msg = Object.entries(data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join('; ');
      } else if (typeof data === 'string') msg = data;
      else if (err.message) msg = err.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!post) return;
    setDeleting(true);
    setError('');
    try {
      await communicationPostsApi.deleteCommunicationPost(postId, token);
      setShowDeleteConfirm(false);
      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Failed to delete post:', err);
      const data = err?.response?.data;
      let msg = 'Не удалось удалить пост связи';
      if (data && typeof data === 'object' && data.detail) msg = data.detail;
      else if (typeof data === 'string') msg = data;
      else if (err.message) msg = err.message;
      setError(msg);
    } finally {
      setDeleting(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="add-post-modal-overlay">
        <div className="add-post-modal-container">
          <div className="add-post-modal-header">
            <h2 className="add-post-modal-title">Загрузка...</h2>
            <button onClick={onClose} className="add-post-modal-close-btn"><X size={20} /></button>
          </div>
          <div className="add-post-form" style={{ padding: '2rem', textAlign: 'center' }}>
            Загрузка данных поста...
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="add-post-modal-overlay">
        <div className="add-post-modal-container">
          <div className="add-post-modal-header">
            <h2 className="add-post-modal-title">Ошибка</h2>
            <button onClick={onClose} className="add-post-modal-close-btn"><X size={20} /></button>
          </div>
          <div className="add-post-form" style={{ padding: '2rem' }}>
            {error || 'Пост не найден'}
          </div>
        </div>
      </div>
    );
  }

  const childrenCount = post.children_count ?? post.children?.length ?? 0;
  const isRootPost = !post.parent;
  const facilityChanged = originalFacilityId !== selectedFacilityId;
  const postKindMeta = getKindMeta(post.kind);
  const parentKindMeta = post.parent ? getKindMeta(post.parent.kind) : null;

  return (
    <div className="add-post-modal-overlay">
      <div className="add-post-modal-container">
        <div className="add-post-modal-header">
          <div className="add-post-modal-header-titles">
            <h2 className="add-post-modal-title">Редактировать пост</h2>
            {post.parent && (
              <div className="add-post-modal-parent">
                <CornerDownRight
                  size={14}
                  className="add-post-modal-parent__icon"
                />
                <span className="add-post-modal-parent__type">
                  {parentKindMeta?.full || '—'}
                </span>
                <span className="add-post-modal-parent__sep">·</span>
                <span
                  className="add-post-modal-parent__name"
                  title={post.parent.name}
                >
                  {post.parent.name}
                </span>
              </div>
            )}
          </div>
          <button onClick={onClose} className="add-post-modal-close-btn"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="add-post-form">
          <div className="add-post-form-group">
            <label className="add-post-form-label">Тип поста</label>
            <div className="add-post-type-fixed">
              <span className="add-post-type-fixed__value">
                {postKindMeta?.full || '—'}
              </span>
            </div>
            <div className="add-post-form-hint">
              Тип поста нельзя изменить после создания
            </div>
          </div>

          <div className="add-post-form-group">
            <label htmlFor="name" className="add-post-form-label">Название *</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="add-post-form-input"
              autoFocus
              required
            />
          </div>

          {/* Подразделение — только для корневых постов.
              Для ПС / НДР наследуется от родителя (не показываем). */}
          {isRootPost && (
            <div className="add-post-form-group">
              <label className="add-post-form-label">Подразделение</label>
              <div className="add-post-select-display add-post-select-display--disabled">
                <span className="add-post-select-display__value">
                  {post.division_name || '—'}
                </span>
                <Lock size={16} className="add-post-select-display__icon" />
              </div>
            </div>
          )}

          {isRootPost && (
            <div className="add-post-form-group">
              <label className="add-post-form-label">Объект</label>
              <PostSelect
                id="facility"
                value={selectedFacilityId}
                onChange={v => setSelectedFacilityId(v)}
                options={facilities.map(f => ({
                  value: f.id,
                  label: f.typeName || f.name,
                  description: f.address || undefined,
                }))}
                emptyOption={{ value: '', label: '— Не привязан к объекту —' }}
                loading={facilitiesLoading}
                loadingText="Загрузка объектов..."
                emptyText="В подразделении поста нет объектов"
                searchable
                searchPlaceholder="Поиск по типу или адресу..."
                noResultsText="Объекты не найдены"
              />
              {!facilitiesLoading && facilities.length === 0 && (
                <div className="add-post-form-hint">
                  В подразделении поста нет объектов
                </div>
              )}
              {!facilitiesLoading && facilities.length > 0 && facilityChanged && (
                <div className="add-post-form-hint">
                  Привязка будет изменена после сохранения
                </div>
              )}
            </div>
          )}

          <div className="add-post-form-group">
            <label htmlFor="description" className="add-post-form-label">Описание</label>
            <textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="add-post-form-input add-post-form-textarea"
            />
          </div>

          {error && <div className="add-post-form-error">{error}</div>}

          <div className="add-post-form-actions">
            <button
              type="button"
              className="add-post-form-delete-btn"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading || deleting}
              title="Удалить пост"
            >
              <Trash2 size={16} />
              <span>Удалить</span>
            </button>

            <div className="add-post-form-actions-spacer" />

            <button
              type="button"
              onClick={onClose}
              className="add-post-form-cancel-btn"
              disabled={loading || deleting}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="add-post-form-submit-btn"
              disabled={loading || deleting || !name.trim()}
            >
              {loading ? 'Сохранение...' : (<><Check size={16} /> Сохранить</>)}
            </button>
          </div>
        </form>
      </div>

      {showDeleteConfirm && (
        <DeleteConfirmationModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteConfirm}
          title="Удаление поста связи"
          message={
            childrenCount > 0
              ? `Удалить «${post.name}»? Все вложенные элементы также будут удалены.`
              : `Удалить «${post.name}»?`
          }
        />
      )}
    </div>
  );
}