import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { X, Check, ChevronDown } from 'lucide-react';
import { communicationPostsApi, divisionsApi } from '../../../../../api';
import './CommunicationPosts.css';

export function AddCommunicationPostForm() {
  const { id: divisionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const token = localStorage.getItem('accessToken');

  const [name, setName] = useState('');
  const [division, setDivision] = useState('');
  const [subdivisionId, setSubdivisionId] = useState('');
  const [description, setDescription] = useState('');
  const [divisions, setDivisions] = useState<any[]>([]);
  const [subdivisions, setSubdivisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDivisionsOpen, setIsDivisionsOpen] = useState(false);
  const [isSubdivisionsOpen, setIsSubdivisionsOpen] = useState(false);

  const fetchDivisions = async () => {
    try {
      const data = await divisionsApi.getDivisions(token);
      setDivisions(data);
      if (divisionId) {
        setDivision(divisionId);
        fetchSubdivisions(divisionId);
      }
    } catch (err) {
      console.error('Ошибка при загрузке подразделений:', err);
    }
  };

  const fetchSubdivisions = async (divisionId: string) => {
    try {
      const data = await divisionsApi.getDivisionById(divisionId, token);
      setSubdivisions(data.subdivisions || []);
    } catch (err) {
      console.error('Ошибка при загрузке отделений:', err);
    }
  };

  useEffect(() => {
    if (divisionId) {
      setDivision(divisionId);
      fetchSubdivisions(divisionId).then(() => {
        // Если есть subdivisionId в URL, устанавливаем его
        if (searchParams.get('subdivision')) {
          setSubdivisionId(searchParams.get('subdivision') || '');
        }
      });
    }
  }, [divisionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await communicationPostsApi.createCommunicationPost({
        name,
        division,
        subdivision: subdivisionId || undefined,
        description
      }, token);
      navigate(-1);
    } catch (err) {
      setError('Не удалось создать пост связи');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleDivisionChange = (divId: string) => {
    setDivision(divId);
    setSubdivisionId('');
    fetchSubdivisions(divId);
    setIsDivisionsOpen(false);
  };

  return (
    <div className="add-post-modal-overlay">
      <div className="add-post-modal-container">
        <div className="add-post-modal-header">
          <h2 className="add-post-modal-title">Добавить пост связи</h2>
          <button
            onClick={handleCancel}
            className="add-post-modal-close-btn"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-post-form">
          <div className="add-post-form-group">
            <label htmlFor="name" className="add-post-form-label">
              Наименование *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="add-post-form-input"
              required
            />
          </div>

          {divisions.some(d => d.subdivisions && d.subdivisions.length > 0) && (
            <div className="add-post-form-group">
              <label htmlFor="subdivision" className="add-post-form-label">
                Отделение
              </label>
              <div className="add-post-select-container">
                <div
                  className={`add-post-select-display ${!division ? 'add-post-select-disabled' : ''}`}
                  onClick={() => division && setIsSubdivisionsOpen(!isSubdivisionsOpen)}
                >
                  <span>{subdivisions.find(s => s.id === subdivisionId)?.name || 'Не выбрано'}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-transform ${isSubdivisionsOpen ? 'transform rotate-180' : ''}`}
                  />
                </div>

                {isSubdivisionsOpen && division && (
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
                    {subdivisions.map((subdivision) => (
                      <div
                        key={subdivision.id}
                        className="add-post-select-option"
                        onClick={() => {
                          setSubdivisionId(subdivision.id);
                          setIsSubdivisionsOpen(false);
                        }}
                      >
                        {subdivision.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="add-post-form-group">
            <label htmlFor="description" className="add-post-form-label">
              Описание
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="add-post-form-input add-post-form-textarea"
            />
          </div>

          {error && (
            <div className="add-post-form-error">
              {error}
            </div>
          )}

          <div className="add-post-form-actions">
            <button
              type="button"
              onClick={handleCancel}
              className="add-post-form-cancel-btn"
              disabled={loading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="add-post-form-submit-btn"
              disabled={loading || !name || !division}
            >
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