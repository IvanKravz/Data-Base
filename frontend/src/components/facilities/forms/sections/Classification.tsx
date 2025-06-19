import React, { useEffect, useState } from 'react';
import { Tag, Star, Wifi, Plus, X } from 'lucide-react';
import { Facility } from '../../../../types';
import { api } from '../../../../api';
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

  // Определяем типы, которые делают объект закрытым
  const CLOSED_FACILITY_TYPES = ['Станция', 'ШД'];

  useEffect(() => {
    const fetchFacilityTypes = async () => {
      if (!token) return;
      try {
        setIsLoading(true);
        const { data } = await api.get('/facilities/facility-types/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFacilityTypes(data.results || []);
      } catch (error) {
        console.error('Ошибка загрузки типов объектов:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFacilityTypes();
  }, [token]);

  useEffect(() => {
    const fetchCommunicationPosts = async () => {
      if (!token || !divisionId) return;
      try {
        setIsLoading(true);
        const params: any = { division: divisionId };
        if (subdivisionId) {
          params.subdivision = subdivisionId;
        }

        const { data } = await api.get('/facilities/communication-posts/', {
          params,
          headers: { Authorization: `Bearer ${token}` }
        });
        const allPosts = data.results || [];
        setCommunicationPosts(allPosts);

        // Filter out posts that are already selected
        const selectedPostIds = formData.communication_posts?.map(p => p.id) || [];
        setAvailablePosts(allPosts.filter(post => !selectedPostIds.includes(post.id)));
      } catch (error) {
        console.error('Ошибка загрузки постов связи:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommunicationPosts();
  }, [token, divisionId, subdivisionId, formData.communication_posts]);

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
        // Если объект становится открытым, сбрасываем класс
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

  // Handle adding a new post
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

  // Handle removing a post
  const handleRemovePost = (postId: string) => {
    onChange({
      communication_posts: (formData.communication_posts || []).filter(p => p.id.toString() !== postId)
    });
  };

  return (
    <div className="facility-card-edit">
      <div className="facility-card-header-edit">
        <Tag size={20} />
        <h3 className="facility-card-title-edit">Классификация</h3>
      </div>
      <div className="facility-card-content-edit">
        <div className="facility-form-field-edit">
          <label className="facility-form-label-edit">
            Тип объекта
          </label>
          <div className="facility-form-input-container-edit">
            <Tag className="facility-form-icon-edit" />
            <select
              value={formData.type?.id?.toString() || ''}
              onChange={handleTypeChange}
              className="facility-form-select-edit"
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
          <div className="facility-form-field-edit">
            <label className="facility-form-label-edit">
              Посты связи
            </label>

            {/* Display selected posts */}
            <div className="selected-posts-list">
              {(formData.communication_posts || []).map(post => (
                <div key={post.id} className="selected-post-item">
                  <span>{post.name}</span>
                  <button
                    type="button"
                    className="remove-post-button"
                    onClick={() => handleRemovePost(String(post.id))}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new post controls */}
            <div className="add-post-controls">
              <div className="facility-form-input-container-edit" style={{ flex: 1 }}>
                <Wifi className="facility-form-icon-edit" />
                <select
                  value={newPostId}
                  onChange={(e) => setNewPostId(e.target.value)}
                  className="facility-form-select-edit"
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
                className="add-post-button"
                onClick={handleAddPost}
                disabled={!newPostId}
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        )}

        {formData.is_closed && (
          <div className="facility-form-field-edit">
            <label className="facility-form-label-edit">
              Класс
            </label>
            <div className="facility-form-input-container-edit">
              <Star className="facility-form-icon-edit" />
              <select
                value={formData.facility_class || ''}
                onChange={handleClassChange}
                className="facility-form-select-edit"
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