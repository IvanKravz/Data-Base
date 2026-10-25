// components/divisions/DivisionDetails/sections/CommunicationPosts/AddCommunicationPostForm.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { X, Check, Lock, CornerDownRight } from 'lucide-react';
import { communicationPostsApi, divisionsApi } from '../../../../../api';
import type { CommunicationPostKind } from '../../../../../types';
import { CommunicationPostKindBadge } from './CommunicationPostKindBadge';
import { getChildKindFor, getKindMeta } from './communicationPostKind';
import { PostSelect } from './PostSelect';
import {
  loadFacilitiesForDivision,
  setFacilityPostLink,
  type FacilityOption,
} from './postFacilityHelpers';
import './styles/CommunicationPosts.css';

interface ParentContext {
  id: string;
  name: string;
  kind: CommunicationPostKind;
  division: string;
  subdivision?: string | null;
}

interface AddCommunicationPostFormProps {
  onClose: () => void;
  onSaved: () => void;
  onCreated?: (post: any) => void;
  divisionId?: string;
  subdivisionId?: string;
  parentPost?: ParentContext | null;
  defaultRootKind?: 'P' | 'KP';
  facilityId?: string;
  facilityName?: string;
}

export function AddCommunicationPostForm({
  onClose,
  onSaved,
  onCreated,
  divisionId: initialDivisionId,
  subdivisionId: initialSubdivisionId,
  parentPost = null,
  defaultRootKind = 'P',
  facilityId: initialFacilityId,
  facilityName: initialFacilityName,
}: AddCommunicationPostFormProps) {
  const token = localStorage.getItem('accessToken') || '';

  const isChild = Boolean(parentPost);
  const childKind: CommunicationPostKind | null = isChild
    ? getChildKindFor(parentPost!.kind)
    : null;
  const childMeta = childKind ? getKindMeta(childKind) : null;
  const parentMeta = parentPost ? getKindMeta(parentPost.kind) : null;

  const isFacilityLocked = Boolean(initialFacilityId);

  const [rootKind, setRootKind] = useState<'P' | 'KP'>(defaultRootKind);
  const effectiveKind: CommunicationPostKind = isChild
    ? (childKind as CommunicationPostKind)
    : rootKind;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [division, setDivision] = useState<string>(
    isChild ? parentPost!.division : (initialDivisionId || '')
  );
  const [subdivisionId, setSubdivisionId] = useState<string>(
    isChild
      ? (parentPost!.subdivision ?? '')
      : (initialSubdivisionId || '')
  );

  const [divisions, setDivisions] = useState<any[]>([]);
  const [subdivisions, setSubdivisions] = useState<any[]>([]);

  const [facilities, setFacilities] = useState<FacilityOption[]>([]);
  const [facilitiesLoading, setFacilitiesLoading] = useState(false);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isFromDivision = !isChild && Boolean(initialDivisionId);

  useEffect(() => {
    const load = async () => {
      if (isChild && parentPost?.division) {
        try {
          const div = await divisionsApi.getDivisionById(parentPost.division, token);
          setDivisions([div]);
          setSubdivisions(div.subdivisions || []);
        } catch (e) { console.error(e); }
        return;
      }
      if (isFromDivision && initialDivisionId) {
        try {
          const div = await divisionsApi.getDivisionById(initialDivisionId, token);
          setDivisions([div]);
          setSubdivisions(div.subdivisions || []);
        } catch (e) { console.error(e); }
      } else {
        try {
          const data = await divisionsApi.getDivisions(token);
          setDivisions(data);
        } catch (e) { console.error(e); }
      }
    };
    load();
  }, [isChild, isFromDivision, initialDivisionId, parentPost?.division, token]);

  useEffect(() => {
    if (isChild || !division) {
      if (!isChild) setSubdivisions([]);
      return;
    }
    const load = async () => {
      try {
        const div = await divisionsApi.getDivisionById(division, token);
        setSubdivisions(div.subdivisions || []);
      } catch (e) { console.error(e); }
    };
    load();
  }, [isChild, division, token]);

  useEffect(() => {
    if (isChild || isFacilityLocked || !division) {
      if (!isChild && !isFacilityLocked) setFacilities([]);
      return;
    }
    let cancelled = false;
    setFacilitiesLoading(true);
    loadFacilitiesForDivision(token, division, subdivisionId || null)
      .then(list => {
        if (cancelled) return;
        setFacilities(list);
        setSelectedFacilityId(prev =>
          prev && list.some(f => f.id === prev) ? prev : ''
        );
      })
      .catch(e => {
        if (cancelled) return;
        console.error(e);
        setFacilities([]);
        setSelectedFacilityId('');
      })
      .finally(() => { if (!cancelled) setFacilitiesLoading(false); });
    return () => { cancelled = true; };
  }, [isChild, isFacilityLocked, division, subdivisionId, token]);

  const divisionName = useMemo(
    () => divisions.find(d => String(d.id) === division)?.name || '',
    [division, divisions]
  );

  const subdivisionName = useMemo(
    () => subdivisions.find(s => String(s.id) === subdivisionId)?.name || '',
    [subdivisionId, subdivisions]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!division) { setError('Не выбрано подразделение'); setLoading(false); return; }
    if (!name.trim()) { setError('Введите название'); setLoading(false); return; }

    const payload = {
      name: name.trim(),
      kind: effectiveKind,
      parent: isChild ? parseInt(parentPost!.id, 10) : null,
      division: parseInt(division, 10),
      subdivision: subdivisionId ? parseInt(subdivisionId, 10) : null,
      description: description.trim() || undefined,
    };

    try {
      const created = await communicationPostsApi.createCommunicationPost(payload, token);

      if (!isChild && !isFacilityLocked && selectedFacilityId && created?.id) {
        const selected = facilities.find(f => f.id === selectedFacilityId);
        if (selected) {
          try {
            await setFacilityPostLink(
              token,
              selectedFacilityId,
              String(created.id),
              'add',
              selected.postIds,
            );
          } catch (linkErr) {
            console.error('Failed to link post to facility:', linkErr);
          }
        }
      }

      onCreated?.(created);
      onSaved();
      onClose();
    } catch (err: any) {
      const data = err?.response?.data;
      let msg = 'Не удалось создать пост связи';
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

  const title = isChild
    ? `Добавить ${childMeta?.full || 'элемент'}`
    : 'Добавить пост связи';

  return (
    <div className="add-post-modal-overlay">
      <div className="add-post-modal-container">
        <div className="add-post-modal-header">
          <div className="add-post-modal-header-titles">
            <h2 className="add-post-modal-title">{title}</h2>
            {isChild && parentPost && (
              <div className="add-post-modal-parent">
                <CornerDownRight
                  size={14}
                  className="add-post-modal-parent__icon"
                />
                <span className="add-post-modal-parent__type">
                  {parentMeta?.full || '—'}
                </span>
                <span className="add-post-modal-parent__sep">·</span>
                <span
                  className="add-post-modal-parent__name"
                  title={parentPost.name}
                >
                  {parentPost.name}
                </span>
              </div>
            )}
          </div>
          <button onClick={onClose} className="add-post-modal-close-btn">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-post-form">
          {isChild ? (
            <div className="add-post-form-group">
              <label className="add-post-form-label">Тип поста</label>
              <div className="add-post-type-fixed">
                <span className="add-post-type-fixed__value">
                  {childMeta?.full || '—'}
                </span>
              </div>
              <div className="add-post-form-hint">
                Тип определён автоматически по родительскому посту
              </div>
            </div>
          ) : (
            <div className="add-post-form-group">
              <label className="add-post-form-label">Тип поста *</label>
              <div className="add-post-radio-group">
                <label className={`add-post-radio ${rootKind === 'P' ? 'add-post-radio--active' : ''}`}>
                  <input
                    type="radio"
                    name="rootKind"
                    value="P"
                    checked={rootKind === 'P'}
                    onChange={() => setRootKind('P')}
                  />
                  <span className="add-post-radio__dot" />
                  <span className="add-post-radio__label">
                    <CommunicationPostKindBadge kind="P" size="sm" />
                    <span>Пост связи</span>
                  </span>
                </label>
                <label className={`add-post-radio ${rootKind === 'KP' ? 'add-post-radio--active' : ''}`}>
                  <input
                    type="radio"
                    name="rootKind"
                    value="KP"
                    checked={rootKind === 'KP'}
                    onChange={() => setRootKind('KP')}
                  />
                  <span className="add-post-radio__dot" />
                  <span className="add-post-radio__label">
                    <CommunicationPostKindBadge kind="KP" size="sm" />
                    <span>Командно-пунктовый пост</span>
                  </span>
                </label>
              </div>
            </div>
          )}

          <div className="add-post-form-group">
            <label htmlFor="name" className="add-post-form-label">Название *</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="add-post-form-input"
              placeholder={
                isChild
                  ? (childKind === 'NDR' ? 'Например: 1НДР-111' : 'Например: 1ПС-110')
                  : 'Например: 1П-100'
              }
              autoFocus
              required
            />
          </div>

          {/* Подразделение — только для корневых постов.
              Для ПС / НДР наследуется от родителя (не показываем). */}
          {!isChild && (
            <div className="add-post-form-group">
              <label className="add-post-form-label">
                Подразделение {isFromDivision ? '' : '*'}
              </label>
              {isFromDivision ? (
                <>
                  <div className="add-post-select-display add-post-select-display--disabled">
                    <span className="add-post-select-display__value">
                      {divisionName || 'Загрузка...'}
                    </span>
                    <Lock size={16} className="add-post-select-display__icon" />
                  </div>
                  <div className="add-post-form-hint">
                    Подразделение выбрано автоматически из текущего контекста
                  </div>
                </>
              ) : (
                <PostSelect
                  id="division"
                  value={division}
                  onChange={v => {
                    setDivision(v);
                    setSubdivisionId('');
                    setSelectedFacilityId('');
                  }}
                  options={divisions.map(d => ({ value: String(d.id), label: d.name }))}
                  emptyOption={{ value: '', label: '— Выберите подразделение —' }}
                />
              )}
            </div>
          )}

          {/* Отделение — только для корневых постов.
              Для ПС / НДР наследуется от родителя (не показываем). */}
          {!isChild && subdivisions.length > 0 && (
            <div className="add-post-form-group">
              <label className="add-post-form-label">Отделение</label>
              <PostSelect
                id="subdivision"
                value={subdivisionId}
                onChange={v => {
                  setSubdivisionId(v);
                  setSelectedFacilityId('');
                }}
                options={subdivisions.map(s => ({ value: String(s.id), label: s.name }))}
                emptyOption={{ value: '', label: '— Не выбрано —' }}
              />
            </div>
          )}

          {!isChild && (
            <div className="add-post-form-group">
              <label className="add-post-form-label">Объект</label>

              {isFacilityLocked ? (
                <>
                  <div className="add-post-select-display add-post-select-display--disabled">
                    <span className="add-post-select-display__value">
                      {initialFacilityName || 'Текущий объект'}
                    </span>
                    <Lock size={16} className="add-post-select-display__icon" />
                  </div>
                  <div className="add-post-form-hint">
                    Пост будет автоматически привязан к этому объекту
                  </div>
                </>
              ) : (
                <>
                  <PostSelect
                    id="facility"
                    value={selectedFacilityId}
                    onChange={v => setSelectedFacilityId(v)}
                    options={facilities.map(f => ({
                      value: f.id,
                      label: f.typeName || f.name,
                      description: f.address || undefined,
                    }))}
                    emptyOption={{ value: '', label: '— Не привязывать к объекту —' }}
                    disabled={!division}
                    loading={Boolean(division) && facilitiesLoading}
                    loadingText="Загрузка объектов..."
                    emptyText="Нет объектов в выбранном подразделении"
                    searchable
                    searchPlaceholder="Поиск по типу или адресу..."
                    noResultsText="Объекты не найдены"
                  />
                  {!division && (
                    <div className="add-post-form-hint">Сначала выберите подразделение</div>
                  )}
                  {division && !facilitiesLoading && facilities.length === 0 && (
                    <div className="add-post-form-hint">
                      В выбранном подразделении/отделении нет объектов
                    </div>
                  )}
                  {division && !facilitiesLoading && facilities.length > 0 && (
                    <div className="add-post-form-hint">
                      Список объектов отфильтрован по выбранному подразделению и отделению
                    </div>
                  )}
                </>
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
              placeholder="Необязательно"
            />
          </div>

          {error && <div className="add-post-form-error">{error}</div>}

          <div className="add-post-form-actions">
            <button type="button" onClick={onClose} className="add-post-form-cancel-btn" disabled={loading}>
              Отмена
            </button>
            <button
              type="submit"
              className="add-post-form-submit-btn"
              disabled={loading || !name.trim() || !division}
            >
              {loading ? 'Сохранение...' : (<><Check size={16} /> Сохранить</>)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}