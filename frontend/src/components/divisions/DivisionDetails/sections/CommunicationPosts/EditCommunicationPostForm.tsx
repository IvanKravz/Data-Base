import React, { useState, useEffect } from 'react';
import { X, Check, ChevronDown } from 'lucide-react';
import { communicationPostsApi, divisionsApi } from '../../../../../api';
import './CommunicationPosts.css';

interface EditCommunicationPostFormProps {
  postId: string;
  onClose: () => void;
  onSaved: () => void;
}

export function EditCommunicationPostForm({ postId, onClose, onSaved }: EditCommunicationPostFormProps) {
  const token = localStorage.getItem('accessToken');

  const [name, setName] = useState('');
  const [division, setDivision] = useState<string>('');
  const [subdivisionId, setSubdivisionId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [divisions, setDivisions] = useState<any[]>([]);
  const [subdivisions, setSubdivisions] = useState<any[]>([]);
  const [isDivisionsOpen, setIsDivisionsOpen] = useState(false);
  const [isSubdivisionsOpen, setIsSubdivisionsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');

  // Загружаем данные поста
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const post = await communicationPostsApi.getCommunicationPost(postId, token);
        console.log('Загружен пост для редактирования:', post);

        setName(post.name);

        // Извлекаем ID подразделения (может быть число или объект с id)
        let divisionId = '';
        if (post.division && typeof post.division === 'object' && 'id' in post.division) {
          divisionId = String(post.division.id);
        } else if (post.division) {
          divisionId = String(post.division);
        }
        setDivision(divisionId);

        // Извлекаем ID отделения
        let subId = '';
        if (post.subdivision && typeof post.subdivision === 'object' && 'id' in post.subdivision) {
          subId = String(post.subdivision.id);
        } else if (post.subdivision) {
          subId = String(post.subdivision);
        }
        setSubdivisionId(subId);

        setDescription(post.description || '');

        console.log('Установлены значения:', { divisionId, subId });
      } catch (err) {
        setError('Не удалось загрузить данные поста');
        console.error(err);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchPost();
  }, [postId, token]);

  // Загружаем все подразделения для выпадающего списка
  useEffect(() => {
    const fetchDivisions = async () => {
      try {
        const data = await divisionsApi.getDivisions(token);
        setDivisions(data);
        console.log('Загружены подразделения:', data);
      } catch (err) {
        console.error('Ошибка при загрузке подразделений:', err);
      }
    };
    fetchDivisions();
  }, [token]);

  // При изменении выбранного подразделения загружаем его отделения
  useEffect(() => {
    const fetchSubdivisions = async () => {
      if (!division) {
        setSubdivisions([]);
        return;
      }
      try {
        const data = await divisionsApi.getDivisionById(division, token);
        setSubdivisions(data.subdivisions || []);
        console.log(`Загружены отделения для division ${division}:`, data.subdivisions);
      } catch (err) {
        console.error('Ошибка при загрузке отделений:', err);
      }
    };
    fetchSubdivisions();
  }, [division, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!division) {
      setError('Пожалуйста, выберите подразделение');
      setLoading(false);
      return;
    }

    // Преобразуем ID в числа (сервер ожидает числовые значения)
    const payload = {
      name,
      division: parseInt(division, 10),
      subdivision: subdivisionId ? parseInt(subdivisionId, 10) : undefined,
      description,
    };
    console.log('Отправляем данные на обновление:', payload);

    try {
      await communicationPostsApi.updateCommunicationPost(postId, payload, token);
      console.log('Обновление успешно');
      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Ошибка при обновлении:', err);
      let msg = 'Не удалось обновить пост связи';
      if (err.response) {
        console.log('Ответ сервера с ошибкой:', err.response.data);
        if (err.response.data && typeof err.response.data === 'object') {
          if (err.response.data.detail) {
            msg = err.response.data.detail;
          } else {
            const errors = Object.entries(err.response.data)
              .map(([key, value]) => `${key}: ${value}`)
              .join('; ');
            if (errors) msg = errors;
          }
        } else if (typeof err.response.data === 'string') {
          msg = err.response.data;
        }
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="add-post-modal-overlay">
        <div className="add-post-modal-container">
          <div className="add-post-modal-header">
            <h2 className="add-post-modal-title">Загрузка...</h2>
            <button onClick={onClose} className="add-post-modal-close-btn">
              <X size={24} />
            </button>
          </div>
          <div className="add-post-form" style={{ padding: '2rem', textAlign: 'center' }}>
            Загрузка данных поста...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="add-post-modal-overlay">
      <div className="add-post-modal-container">
        <div className="add-post-modal-header">
          <h2 className="add-post-modal-title">Редактировать пост связи</h2>
          <button onClick={onClose} className="add-post-modal-close-btn">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-post-form">
          <div className="add-post-form-group">
            <label htmlFor="name" className="add-post-form-label">Наименование *</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="add-post-form-input"
              required
            />
          </div>

          <div className="add-post-form-group">
            <label className="add-post-form-label">Подразделение *</label>
            <div className="add-post-select-container">
              <div
                className="add-post-select-display"
                onClick={() => setIsDivisionsOpen(!isDivisionsOpen)}
              >
                <span>
                  {divisions.find(d => d.id.toString() === division)?.name || 'Выберите подразделение'}
                </span>
                <ChevronDown
                  className={`h-5 w-5 text-gray-400 transition-transform ${isDivisionsOpen ? 'transform rotate-180' : ''}`}
                />
              </div>
              {isDivisionsOpen && (
                <div className="add-post-select-options">
                  {divisions.map((div) => (
                    <div
                      key={div.id}
                      className="add-post-select-option"
                      onClick={() => {
                        setDivision(div.id.toString());
                        setSubdivisionId('');
                        setIsDivisionsOpen(false);
                      }}
                    >
                      {div.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {subdivisions.length > 0 && (
            <div className="add-post-form-group">
              <label className="add-post-form-label">Отделение</label>
              <div className="add-post-select-container">
                <div
                  className="add-post-select-display"
                  onClick={() => setIsSubdivisionsOpen(!isSubdivisionsOpen)}
                >
                  <span>
                    {subdivisions.find(s => s.id.toString() === subdivisionId)?.name || 'Не выбрано'}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-transform ${isSubdivisionsOpen ? 'transform rotate-180' : ''}`}
                  />
                </div>
                {isSubdivisionsOpen && (
                  <div className="add-post-select-options">
                    <div
                      className="add-post-select-option"
                      onClick={() => {
                        setSubdivisionId('');
                        setIsSubdivisionsOpen(false);
                      }}
                    >
                      Не выбрано
                    </div>
                    {subdivisions.map((sub) => (
                      <div
                        key={sub.id}
                        className="add-post-select-option"
                        onClick={() => {
                          setSubdivisionId(sub.id.toString());
                          setIsSubdivisionsOpen(false);
                        }}
                      >
                        {sub.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="add-post-form-group">
            <label htmlFor="description" className="add-post-form-label">Описание</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="add-post-form-input add-post-form-textarea"
            />
          </div>

          {error && <div className="add-post-form-error">{error}</div>}

          <div className="add-post-form-actions">
            <button type="button" onClick={onClose} className="add-post-form-cancel-btn" disabled={loading}>
              Отмена
            </button>
            <button type="submit" className="add-post-form-submit-btn" disabled={loading || !name || !division}>
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Сохранение...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Сохранить
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}