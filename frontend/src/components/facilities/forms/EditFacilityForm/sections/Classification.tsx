import React, { useEffect, useState } from 'react';
import { Tag, Star, Wifi, Plus, X } from 'lucide-react';
import { Facility } from '../../../../../types';
import { api } from '../../../../../api';
import '../EditFacilityForm.css';

interface ClassificationProps {
  formData: Partial<Facility>;
  onChange: (data: Partial<Facility>) => void;
  divisionId?: string;
  facilityTypes?: any[];      
  communicationPosts?: any[];   
  isLoading?: boolean;         
}

export function Classification({ 
  formData, 
  onChange, 
  divisionId, 
  facilityTypes: propFacilityTypes,
  communicationPosts: propCommunicationPosts,
  isLoading: propIsLoading
}: ClassificationProps) {
  const token = localStorage.getItem('accessToken');

  // Состояния для fallback-загрузки (если пропсы пусты)
  const [internalFacilityTypes, setInternalFacilityTypes] = useState<any[]>([]);
  const [internalCommunicationPosts, setInternalCommunicationPosts] = useState<any[]>([]);
  const [internalLoading, setInternalLoading] = useState(false);

  // Состояние для доступных постов (не выбранных)
  const [availablePosts, setAvailablePosts] = useState<any[]>([]);
  const [newPostId, setNewPostId] = useState('');

  // Используем переданные данные или внутренние
  const facilityTypes = propFacilityTypes?.length ? propFacilityTypes : internalFacilityTypes;
  const communicationPosts = propCommunicationPosts?.length ? propCommunicationPosts : internalCommunicationPosts;
  const isLoading = propIsLoading !== undefined ? propIsLoading : internalLoading;

  // Загрузка типов объектов (только если не переданы через пропсы)
  useEffect(() => {
    if (propFacilityTypes?.length) return;
    if (!token) return;

    const fetchFacilityTypes = async () => {
      setInternalLoading(true);
      try {
        const { data } = await api.get('/facilities/facility-types/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setInternalFacilityTypes(data || []);
      } catch (error) {
        console.error('Ошибка загрузки типов объектов:', error);
      } finally {
        setInternalLoading(false);
      }
    };
    fetchFacilityTypes();
  }, [token, propFacilityTypes]);

  // Загрузка постов связи (только если не переданы через пропсы)
  useEffect(() => {
    if (propCommunicationPosts?.length) {
      // Если посты переданы, но возможно они не отфильтрованы по divisionId – фильтруем
      if (divisionId) {
        const filtered = propCommunicationPosts.filter(
          post => String(post.division?.id) === String(divisionId) || String(post.division) === String(divisionId)
        );
        setInternalCommunicationPosts(filtered);
      } else {
        setInternalCommunicationPosts(propCommunicationPosts);
      }
      return;
    }

    if (!token || !divisionId) {
      setInternalCommunicationPosts([]);
      return;
    }

    const fetchCommunicationPosts = async () => {
      setInternalLoading(true);
      try {
        const { data } = await api.get('/facilities/communication-posts/', {
          params: { division: divisionId },
          headers: { Authorization: `Bearer ${token}` }
        });
        setInternalCommunicationPosts(data || []);
      } catch (error) {
        console.error('Ошибка загрузки постов связи:', error);
        setInternalCommunicationPosts([]);
      } finally {
        setInternalLoading(false);
      }
    };
    fetchCommunicationPosts();
  }, [token, divisionId, propCommunicationPosts]);

  // Обновление списка доступных постов (исключаем уже выбранные)
  useEffect(() => {
    const selectedIds = (formData.communication_posts || []).map(p => p.id);
    const available = communicationPosts.filter(post => !selectedIds.includes(post.id));
    setAvailablePosts(available);
  }, [communicationPosts, formData.communication_posts]);

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedType = facilityTypes.find(t => String(t.id) === e.target.value);
    if (selectedType) {
      onChange({
        type: {
          id: selectedType.id,
          name: selectedType.name,
          description: selectedType.description || '',
          is_closed_type: selectedType.is_closed_type
        },
        is_closed: selectedType.is_closed_type,
        facility_class: selectedType.is_closed_type ? formData.facility_class : null
      });
    } else {
      onChange({ type: null, is_closed: false, facility_class: null });
    }
  };

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ facility_class: e.target.value });
  };

  const handleAddPost = () => {
    if (!newPostId) return;
    const postToAdd = communicationPosts.find(p => String(p.id) === newPostId);
    if (!postToAdd) return;
    const current = formData.communication_posts || [];
    if (current.some(p => p.id === postToAdd.id)) return;
    onChange({ communication_posts: [...current, postToAdd] });
    setNewPostId('');
  };

  const handleRemovePost = (postId: string) => {
    onChange({
      communication_posts: (formData.communication_posts || []).filter(p => String(p.id) !== postId)
    });
  };

  return (
    <div className="facility-form-edit-card">
      <div className="facility-form-edit-card-header">
        <Tag size={20} />
        <h3 className="facility-form-edit-card-title">Классификация</h3>
      </div>
      <div className="facility-form-edit-card-content">
        {/* Тип объекта */}
        <div className="facility-form-edit-field">
          <label className="facility-form-edit-label">Тип объекта</label>
          <div className="facility-form-edit-input-container">
            <Tag className="facility-form-edit-icon" />
            <select
              value={formData.type?.id?.toString() || ''}
              onChange={handleTypeChange}
              className="facility-form-edit-select"
              disabled={isLoading}
              required
            >
              <option value="">Выберите тип объекта</option>
              {facilityTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Посты связи (только если выбран division) */}
        {divisionId && (
          <div className="facility-form-edit-field">
            <label className="facility-form-edit-label">Посты связи</label>

            {/* Список выбранных постов */}
            <div className="facility-form-edit-selected-posts-list">
              {(formData.communication_posts || []).map(post => (
                <div key={post.id} className="facility-form-edit-selected-post-item">
                  <span>{post.name}</span>
                  <button
                    type="button"
                    className="facility-form-edit-remove-post-button"
                    onClick={() => handleRemovePost(String(post.id))}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Добавление нового поста */}
            <div className="facility-form-edit-add-post-controls">
              <div className="facility-form-edit-input-container" style={{ flex: 1 }}>
                <Wifi className="facility-form-edit-icon" />
                <select
                  value={newPostId}
                  onChange={(e) => setNewPostId(e.target.value)}
                  className="facility-form-edit-select"
                  disabled={isLoading || !availablePosts.length}
                >
                  <option value="">Выберите пост связи</option>
                  {availablePosts.map(post => (
                    <option key={post.id} value={post.id}>{post.name}</option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className="facility-form-edit-add-post-button"
                onClick={handleAddPost}
                disabled={!newPostId}
              >
                <Plus size={18} />
              </button>
            </div>

            {availablePosts.length === 0 && communicationPosts.length > 0 && (
              <p className="text-sm text-gray-500 mt-2">Все посты связи для этого подразделения уже добавлены</p>
            )}
            {communicationPosts.length === 0 && divisionId && (
              <p className="text-sm text-gray-500 mt-2">Для этого подразделения нет доступных постов связи</p>
            )}
          </div>
        )}

        {!divisionId && (
          <p className="text-sm text-gray-500">Выберите подразделение, чтобы увидеть доступные посты связи</p>
        )}

        {/* Класс (только для закрытых объектов) */}
        {formData.is_closed && (
          <div className="facility-form-edit-field">
            <label className="facility-form-edit-label">Класс</label>
            <div className="facility-form-edit-input-container">
              <Star className="facility-form-edit-icon" />
              <select
                value={formData.facility_class || ''}
                onChange={handleClassChange}
                className="facility-form-edit-select"
              >
                <option value="">Выберите класс</option>
                <option value="1">1 класс</option>
                <option value="2">2 класс</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}