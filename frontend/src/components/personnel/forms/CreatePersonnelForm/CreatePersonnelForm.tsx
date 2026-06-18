import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Employee, Division } from '../../../../types';
import { employeesApi } from '../../../../api';
import { divisionsApi } from '../../../../api/divisions';
import { message, Modal, Button } from 'antd';
import { ArrowLeft, Camera, User, X, Save, Smartphone, Phone, Mail, AlertCircle, Upload, Trash2 } from 'lucide-react';
import { Avatar } from 'antd';

// Импорты редактируемых карточек
import { BasicInformationCard } from '../EditPersonnelForm/sections/BasicInformationCard';
import { ContactInformationCard } from '../EditPersonnelForm/sections/ContactInformationCard';
import { DatesCard } from '../EditPersonnelForm/sections/DatesCard';
import { ShaWorkerCard } from '../EditPersonnelForm/sections/ShaWorkerCard';
import { CommentsCard } from '../EditPersonnelForm/sections/CommentsCard';
import { AffiliationCard } from '../EditPersonnelForm/sections/AffiliationCard';

// Стили
import '../../PersonnelDetails/PersonnelDetails.css';

export function CreatePersonnelForm() {
  const { id: paramDivisionId } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem('accessToken');
  const [loading, setLoading] = useState(false);
  const [uploadPhotoLoading, setUploadPhotoLoading] = useState(false);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const subdivisionIdFromUrl = searchParams.get('subdivision');

  const navigationState = location.state as {
    divisionId?: string;
    subdivisionId?: string;
    divisionName?: string;
    subdivisionName?: string;
    fromSubdivision?: boolean;
  } | undefined;

  const effectiveDivisionId = paramDivisionId || navigationState?.divisionId;
  const effectiveSubdivisionId = navigationState?.subdivisionId || subdivisionIdFromUrl;
  const fromSubdivision = navigationState?.fromSubdivision || false;
  const isGlobalMode = !effectiveDivisionId;

  const fixedDivision = effectiveDivisionId
    ? { id: effectiveDivisionId, name: navigationState?.divisionName || '' }
    : null;
  const fixedSubdivision =
    effectiveSubdivisionId && fromSubdivision
      ? { id: effectiveSubdivisionId, name: navigationState?.subdivisionName || '' }
      : null;

  const [formData, setFormData] = useState<Employee>({
    id: 0,
    full_name: '',
    personal_phone: '',
    work_phone: '',
    birth_date: '',
    contract_date: '',
    category: '',
    position: '',
    is_material_responsible: false,
    is_sha_worker: false,
    description: null,
    division: fixedDivision,
    subdivision: fixedSubdivision,
    sha_details: null,
    data_state_secrets: null,
    date_end_work: null,
    date_start_work: null,
    year_graduation: null,
    rank: null,
    photo_url: null,
    email: null,
  });

  useEffect(() => {
    const fetchDivisions = async () => {
      try {
        const data = await divisionsApi.getDivisions(token);
        setDivisions(data);
      } catch (err) {
        console.error('Failed to load divisions:', err);
      }
    };
    fetchDivisions();
  }, [token]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleChange = (data: Partial<Employee>) => {
    const field = Object.keys(data)[0];
    if (field && validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleShaWorkerChange = (shaWorker: Employee['sha_details']) => {
    setFormData((prev) => ({
      ...prev,
      sha_details: shaWorker
        ? { ...shaWorker, equipment_conclusions: [...(shaWorker?.equipment_conclusions || [])] }
        : null,
    }));
  };

  const handleAddEquipment = () => {
    if (!formData.sha_details) return;
    const conclusions = formData.sha_details.equipment_conclusions;
    if (conclusions.length > 0) {
      const last = conclusions[conclusions.length - 1];
      if (last.equipment_type.trim() === '' && last.conclusion_number.trim() === '') {
        return;
      }
    }
    setFormData((prev) => ({
      ...prev,
      sha_details: {
        ...prev.sha_details!,
        equipment_conclusions: [
          ...conclusions,
          { equipment_type: '', conclusion_number: '' },
        ],
      },
    }));
  };

  const handleRemoveEquipment = (index: number) => {
    if (!formData.sha_details) return;
    setFormData((prev) => ({
      ...prev,
      sha_details: {
        ...prev.sha_details!,
        equipment_conclusions: prev.sha_details!.equipment_conclusions.filter((_, i) => i !== index),
      },
    }));
  };

  const handleEquipmentChange = (
    index: number,
    field: 'equipment_type' | 'conclusion_number',
    value: string
  ) => {
    if (!formData.sha_details) return;
    setFormData((prev) => ({
      ...prev,
      sha_details: {
        ...prev.sha_details!,
        equipment_conclusions: prev.sha_details!.equipment_conclusions.map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        ),
      },
    }));
  };

  // === Логика работы с фото (как в PersonnelDetails) ===
  const handlePhotoSelect = (file: File) => {
    if (!file.type.match('image.*')) {
      message.error('Пожалуйста, выберите файл изображения');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      message.error('Файл слишком большой. Максимальный размер - 5MB');
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const newPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(newPreviewUrl);
    setSelectedPhoto(file);
    setPhotoModalVisible(false);
  };

  const handlePhotoRemove = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedPhoto(null);
    setPhotoModalVisible(false);
  };

  const handleAvatarClick = () => {
    setPhotoModalVisible(true);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePhotoSelect(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // === Валидация ===
  const validateForm = (): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      errors.full_name = 'ФИО обязательно для заполнения';
    }
    if (!formData.category) {
      errors.category = 'Категория обязательна для выбора';
    }
    if (formData.category && !formData.position) {
      errors.position = 'Должность обязательна для выбора';
    }
    if (!formData.birth_date) {
      errors.birth_date = 'Дата рождения обязательна';
    }
    if (!formData.contract_date) {
      errors.contract_date = 'Дата контракта обязательна';
    }

    if (formData.is_sha_worker) {
      if (!formData.sha_details?.start_date) {
        errors.sha_start_date = 'Дата начала ШР обязательна';
      }
      if (!formData.sha_details?.access_level) {
        errors.sha_access_level = 'Форма допуска обязательна';
      }
      if (formData.sha_details?.equipment_conclusions) {
        const incomplete = formData.sha_details.equipment_conclusions.some(
          item =>
            (item.equipment_type.trim() !== '' || item.conclusion_number.trim() !== '') &&
            (item.equipment_type.trim() === '' || item.conclusion_number.trim() === '')
        );
        if (incomplete) {
          errors.sha_equipment = 'Заполните оба поля (Тип техники и Номер заключения) для каждой записи';
        }
      }
    }

    return errors;
  };

  const handleCreate = async () => {
    if (!token) {
      message.error('Отсутствует токен авторизации');
      return;
    }

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      const firstField = Object.keys(errors)[0];
      const element = document.querySelector(`[name="${firstField}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setLoading(true);
    setValidationErrors({});

    try {
      let shaDetails = formData.sha_details;
      if (formData.is_sha_worker && shaDetails) {
        const filteredConclusions = shaDetails.equipment_conclusions.filter(
          item => item.equipment_type.trim() !== '' && item.conclusion_number.trim() !== ''
        );
        shaDetails = {
          ...shaDetails,
          equipment_conclusions: filteredConclusions,
          start_date: shaDetails.start_date || new Date().toISOString().split('T')[0],
        };
      }

      const dataToSend = {
        ...formData,
        description: formData.description || null,
        sha_details: formData.is_sha_worker ? shaDetails : null,
        data_state_secrets: formData.is_sha_worker ? formData.data_state_secrets : null,
        date_end_work: formData.is_sha_worker ? formData.date_end_work : null,
        date_start_work: formData.is_sha_worker ? formData.date_start_work : null,
        year_graduation: formData.is_sha_worker ? formData.year_graduation : null,
        rank: formData.category === 'civilian' ? null : formData.rank || null,
      };

      const { id: _, ...employeeWithoutId } = dataToSend;
      const createdEmployee = await employeesApi.createPerson(token, employeeWithoutId);

      if (createdEmployee?.id) {
        if (selectedPhoto) {
          setUploadPhotoLoading(true);
          try {
            await employeesApi.uploadPhoto(token, createdEmployee.id, selectedPhoto);
            message.success('Фото загружено');
          } catch (photoErr) {
            console.error('Ошибка загрузки фото:', photoErr);
            message.warning('Сотрудник создан, но не удалось загрузить фото. Вы можете загрузить его позже.');
          } finally {
            setUploadPhotoLoading(false);
          }
        }

        message.success('Сотрудник создан');
        const targetDivisionId = createdEmployee.division?.id || effectiveDivisionId;
        if (isGlobalMode) {
          navigate('/personnel');
        } else if (targetDivisionId) {
          const targetSubdivisionId = effectiveSubdivisionId && fromSubdivision ? effectiveSubdivisionId : undefined;
          const url = targetSubdivisionId
            ? `/divisions/${targetDivisionId}/personnel?subdivision=${targetSubdivisionId}`
            : `/divisions/${targetDivisionId}/personnel`;
          navigate(url, {
            state: {
              divisionId: targetDivisionId,
              subdivisionId: targetSubdivisionId,
              fromSubdivision,
            },
          });
        } else {
          navigate('/personnel');
        }
      } else {
        setValidationErrors({ _general: 'Не удалось создать сотрудника. Неверный ответ сервера.' });
      }
    } catch (err: any) {
      console.error('Ошибка создания сотрудника:', err);
      const errorData = err.response?.data;
      if (errorData && typeof errorData === 'object') {
        const fieldErrors: Record<string, string> = {};
        Object.entries(errorData).forEach(([field, msgs]) => {
          const messageText = Array.isArray(msgs) ? msgs.join(', ') : String(msgs);
          const fieldMap: Record<string, string> = {
            full_name: 'ФИО',
            birth_date: 'Дата рождения',
            contract_date: 'Дата контракта',
            personal_phone: 'Личный телефон',
            work_phone: 'Рабочий телефон',
            position: 'Должность',
            category: 'Категория',
            rank: 'Звание',
            description: 'Примечания',
            sha_details: 'Данные ШаРаботника',
          };
          const displayField = fieldMap[field] || field;
          fieldErrors[field] = `${displayField}: ${messageText}`;
        });
        setValidationErrors(fieldErrors);
      } else {
        setValidationErrors({ _general: 'Не удалось создать сотрудника. Проверьте введенные данные.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (isGlobalMode) {
      navigate('/personnel');
    } else if (effectiveDivisionId) {
      const url =
        effectiveSubdivisionId && fromSubdivision
          ? `/divisions/${effectiveDivisionId}/personnel?subdivision=${effectiveSubdivisionId}`
          : `/divisions/${effectiveDivisionId}/personnel`;
      navigate(url);
    } else {
      navigate('/personnel');
    }
  };

  const isManagement = formData.category === 'management';
  const isTopManagement =
    isManagement &&
    (formData.position === 'Главный руководитель' ||
      formData.position === 'Заместитель главного руководителя');
  const showDivisionField = !isManagement || (isManagement && !isTopManagement);

  const getFieldError = (field: string) => validationErrors[field] || null;
  const isLoading = loading || uploadPhotoLoading;

  return (
    <div className="personnel-details-container">
      {/* Хедер */}
      <div className="personnel-header">
        <div className="personnel-header-left">
          <button className="personnel-header-icon-button" onClick={handleCancel}>
            <ArrowLeft size={20} />
          </button>
          <h1 className="personnel-header-title">Создание нового сотрудника</h1>
        </div>
      </div>

      <div className="personnel-details-layout">
        {/* Левая колонка */}
        <div className="personnel-sidebar">
          <div className="personnel-profile-card">
            <div className="personnel-profile-avatar">
              <div className="personnel-avatar-wrapper" onClick={handleAvatarClick}>
                {previewUrl ? (
                  <img src={previewUrl} alt={formData.full_name || 'Новый сотрудник'} className="personnel-avatar-image" />
                ) : (
                  <Avatar size={120} icon={<Camera size={40} />} style={{ backgroundColor: '#f0f0f0', color: '#a0a0a0' }} />
                )}
                <div className="personnel-avatar-overlay">
                  <Camera size={24} color="white" />
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
              />
            </div>
            <div className="personnel-profile-name">{formData.full_name || 'Новый сотрудник'}</div>
            <div className="personnel-profile-position">{formData.position || '—'}</div>
            {!previewUrl && (
              <Button
                type="primary"
                size="small"
                icon={<Upload size={14} />}
                onClick={() => setPhotoModalVisible(true)}
                className="personnel-upload-button"
              >
                Загрузить фото
              </Button>
            )}
          </div>

          <div className="personnel-contact-card">
            <div className="personnel-contact-card-title">Контакты</div>
            <div className="info-item-personel">
              <Smartphone className="info-item-icon" />
              <div>
                <div className="info-item-label">Личный телефон</div>
                <div className="info-item-value">{formData.personal_phone || '—'}</div>
              </div>
            </div>
            <div className="info-item-personel">
              <Phone className="info-item-icon" />
              <div>
                <div className="info-item-label">Рабочий телефон</div>
                <div className="info-item-value">{formData.work_phone || '—'}</div>
              </div>
            </div>
            {formData.email && (
              <div className="info-item-personel">
                <Mail className="info-item-icon" />
                <div>
                  <div className="info-item-label">Email</div>
                  <div className="info-item-value">{formData.email}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Правая колонка */}
        <div className="personnel-main">
          {/* Блок ошибок валидации */}
          {Object.keys(validationErrors).length > 0 && (
            <div className="validation-errors">
              {Object.entries(validationErrors).map(([field, message]) => (
                <div key={field} className="validation-error-item">
                  <AlertCircle size={16} className="validation-error-icon" />
                  <span>{message}</span>
                </div>
              ))}
            </div>
          )}

          <div className="personnel-tabs-container editing">
            <div className="personnel-tabs-header">
              <button className="personnel-tab-button active">
                <User size={16} className="personnel-tab-icon" />
                Основное
              </button>

              {/* Кнопки действий */}
              <div className="personnel-tabs-actions">
                <button onClick={handleCancel} className="personnel-tabs-action-btn personnel-tabs-action-btn-gray">
                  <X size={14} />
                  <span>Отмена</span>
                </button>
                <button onClick={handleCreate} className="personnel-tabs-action-btn personnel-tabs-action-btn-green" disabled={isLoading}>
                  <Save size={14} />
                  <span>{isLoading ? 'Сохранение...' : 'Создать'}</span>
                </button>
              </div>
            </div>

            <div className="personnel-tab-content">
              <div className="personnel-edit-grid">
                <BasicInformationCard
                  formData={formData}
                  onChange={handleChange}
                  token={token}
                  readOnly={false}
                  errors={{
                    full_name: getFieldError('full_name'),
                    category: getFieldError('category'),
                    position: getFieldError('position'),
                    rank: getFieldError('rank'),
                  }}
                />
                {showDivisionField && (
                  <AffiliationCard
                    formData={formData}
                    divisions={divisions}
                    onChange={handleChange}
                    isTopManagement={isTopManagement}
                    showDivisionField={showDivisionField}
                    fixedDivision={!!fixedDivision}
                    fixedSubdivision={!!fixedSubdivision}
                    readOnly={false}
                  />
                )}
                <ContactInformationCard
                  formData={formData}
                  onChange={handleChange}
                  readOnly={false}
                  errors={{
                    personal_phone: getFieldError('personal_phone'),
                    work_phone: getFieldError('work_phone'),
                  }}
                />
                <DatesCard
                  formData={formData}
                  onChange={handleChange}
                  readOnly={false}
                  errors={{
                    birth_date: getFieldError('birth_date'),
                    contract_date: getFieldError('contract_date'),
                  }}
                />
              </div>

              {/* Блок ШР и комментарии */}
              <div className="create-personnel-sha-grid">
                {formData.is_sha_worker && (
                  <ShaWorkerCard
                    shaWorker={
                      formData.sha_details || {
                        start_date: '',
                        access_level: '1',
                        equipment_conclusions: [],
                      }
                    }
                    onChange={handleShaWorkerChange}
                    onAddEquipment={handleAddEquipment}
                    onRemoveEquipment={handleRemoveEquipment}
                    onEquipmentChange={handleEquipmentChange}
                    readOnly={false}
                    errors={{
                      start_date: getFieldError('sha_start_date'),
                      access_level: getFieldError('sha_access_level'),
                      equipment: getFieldError('sha_equipment'),
                    }}
                  />
                )}
                <CommentsCard
                  description={formData.description || ''}
                  onChange={(description) => handleChange({ description })}
                  readOnly={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Модалка для фото (как в PersonnelDetails) */}
      <Modal
        title="Фото сотрудника"
        open={photoModalVisible}
        onCancel={() => setPhotoModalVisible(false)}
        footer={[
          previewUrl && (
            <Button key="delete" danger icon={<Trash2 size={14} />} onClick={handlePhotoRemove}>
              Удалить
            </Button>
          ),
          <Button
            key="upload"
            type="primary"
            icon={<Upload size={14} />}
            onClick={() => fileInputRef.current?.click()}
          >
            {previewUrl ? 'Заменить' : 'Загрузить'}
          </Button>,
          <Button key="back" onClick={() => setPhotoModalVisible(false)}>
            Закрыть
          </Button>,
        ].filter(Boolean)}
      >
        <div className="personnel-photo-modal-content">
          {previewUrl && (
            <img src={previewUrl} alt={formData.full_name || 'Новый сотрудник'} className="personnel-photo-modal-image" />
          )}
        </div>
      </Modal>
    </div>
  );
}