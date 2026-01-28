import React, { useEffect, useState } from 'react';
import { Tag, Star, Wifi, Plus, X } from 'lucide-react';
import { Facility } from '../../../../../types';
import { api } from '../../../../../api';
import '../EditFacilityForm.css';

interface ClassificationProps {
  formData: Partial<Facility>;
  onChange: (data: Partial<Facility>) => void;
  divisionId?: string;
  subdivisionId?: string;
}

export function Classification({ formData, onChange, divisionId, subdivisionId }: ClassificationProps) {
  const [facilityTypes, setFacilityTypes] = useState<any[]>([]);
  const [communicationPosts, setCommunicationPosts] = useState<any[]>([]);
  const [availablePosts, setAvailablePosts] = useState<any[]>([]);
  const [newPostId, setNewPostId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const token = localStorage.getItem('accessToken');

  const CLOSED_FACILITY_TYPES = ['Станция', 'ШД'];

  useEffect(() => {
    if (!token) return;
    
    const fetchFacilityTypes = async () => {
      try {
        setIsLoading(true);
        const { data } = await api.get('/facilities/facility-types/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFacilityTypes(data || []);
      } catch (error) {
        console.error('Ошибка загрузки типов объектов:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFacilityTypes();
  }, [token]);

  // Загружаем посты связи только по divisionId
  useEffect(() => {
    const fetchCommunicationPosts = async () => {
      if (!token || !divisionId) {
        setCommunicationPosts([]);
        setAvailablePosts([]);
        return;
      }
      
      try {
        setIsLoading(true);
        const { data } = await api.get('/facilities/communication-posts/', {
          params: { division: divisionId },
          headers: { Authorization: `Bearer ${token}` }
        });
        ;
        const allPosts = data || [];
        setCommunicationPosts(allPosts);

        // Фильтруем посты, которые уже выбраны
        const selectedPostIds = formData.communication_posts?.map(p => p.id) || [];
        const filteredPosts = allPosts.filter(post => !selectedPostIds.includes(post.id));
        setAvailablePosts(filteredPosts);
        
      } catch (error) {
        console.error('Ошибка загрузки постов связи:', error);
        setCommunicationPosts([]);
        setAvailablePosts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommunicationPosts();
  }, [token, divisionId, formData.communication_posts]);

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedType = facilityTypes.find(t => t.id.toString() === e.target.value);
    
    if (selectedType) {
      const isClosed = CLOSED_FACILITY_TYPES.includes(selectedType.name);
      
      onChange({ 
        type: {
          id: selectedType.id,
          name: selectedType.name,
          description: selectedType.description || ''
        },
        is_closed: isClosed,
        facility_class: isClosed ? formData.facility_class : null
      });
    } else {
      onChange({ 
        type: null,
        is_closed: false,
        facility_class: null
      });
    }
  };

  const handleAddPost = () => {
    if (!newPostId) return;

    const postToAdd = communicationPosts.find(p => p.id.toString() === newPostId.toString());
    if (!postToAdd) return;

    const currentPosts = formData.communication_posts || [];
    if (currentPosts.some(p => p.id === postToAdd.id)) return;

    onChange({
      communication_posts: [...currentPosts, postToAdd]
    });
    setNewPostId('');
  };

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      class: e.target.value,
      facility_class: e.target.value,
      class_display: `${e.target.value} класс`
    });
  };

  const handleRemovePost = (postId: string) => {
    onChange({
      communication_posts: (formData.communication_posts || []).filter(p => p.id.toString() !== postId)
    });
  };

  return (
    <div className="facility-form-edit-card">
      <div className="facility-form-edit-card-header">
        <Tag size={20} />
        <h3 className="facility-form-edit-card-title">Классификация</h3>
      </div>
      <div className="facility-form-edit-card-content">
        <div className="facility-form-edit-field">
          <label className="facility-form-edit-label">
            Тип объекта
          </label>
          <div className="facility-form-edit-input-container">
            <Tag className="facility-form-edit-icon" />
            <select
              value={formData.type?.id?.toString() || ''}
              onChange={handleTypeChange}
              className="facility-form-edit-select"
              disabled={isLoading}
            >
              <option value="">Выберите тип объекта</option>
              {facilityTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {divisionId && (
          <div className="facility-form-edit-field">
            <label className="facility-form-edit-label">
              Посты связи
            </label>

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
                    <option key={post.id} value={post.id}>
                      {post.name}
                    </option>
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
              <p className="text-sm text-gray-500 mt-2">
                Все посты связи для этого подразделения уже добавлены
              </p>
            )}
            
            {communicationPosts.length === 0 && divisionId && (
              <p className="text-sm text-gray-500 mt-2">
                Для этого подразделения нет доступных постов связи
              </p>
            )}
          </div>
        )}

        {!divisionId && (
          <p className="text-sm text-gray-500">
            Выберите подразделение, чтобы увидеть доступные посты связи
          </p>
        )}

        {formData.is_closed && (
          <div className="facility-form-edit-field">
            <label className="facility-form-edit-label">
              Класс
            </label>
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
