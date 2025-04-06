import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ArrowLeft, Pencil, User, Medal, FileText, GraduationCap, Briefcase, Shield, ChevronRight } from 'lucide-react';
import { updatePerson } from '../../../store/slices/personnelSlice';
import { Employee } from '../../../types';
import { employeesApi } from '../../../api';
import './style.css';

export function QualitativeCharacteristics() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<Partial<Employee>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = localStorage.getItem('accessToken');

  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return '—';
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return '—';
    return dateObj.toLocaleDateString('ru-RU');
  };

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const data = await employeesApi.getPersonById(token, id);
        setEmployee(data);
        setFormData(data);
      } catch (err) {
        setError('Не удалось загрузить данные сотрудника');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [token, id]);

  const formatDateForServer = (date: Date | string | null | undefined): string | null => {
    if (!date) return null;
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return null;
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (employee) {
        const formattedData = {
          ...formData,
          data_state_secrets: formatDateForServer(formData.data_state_secrets),
          year_graduation: formatDateForServer(formData.year_graduation),
          date_start_work: formatDateForServer(formData.date_start_work),
        };

        const updatedPerson = await employeesApi.updatePerson(token, employee.id, formattedData as Employee);
        dispatch(updatePerson(updatedPerson));
        setIsEditing(false);
        setEmployee(updatedPerson);
      }
    } catch (err) {
      setError('Не удалось обновить данные сотрудника');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field: keyof Employee, value: string | Date | boolean) => {
    let processedValue: string | Date | boolean = value;

    if (field === 'year_graduation' || field === 'date_start_work' || field === 'data_state_secrets') {
      if (typeof value === 'string') {
        processedValue = new Date(value);
      }
    }

    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));
  };

  const renderInfoCard = (title: string, icon: React.ReactNode, children: React.ReactNode) => (
    <div className="qc-card">
      <div className="qc-card-header">
        <div className="qc-card-icon">
          {icon}
        </div>
        <h3 className="qc-card-title">{title}</h3>
      </div>
      <div className="qc-card-content">
        {children}
      </div>
    </div>
  );

  const renderField = (label: string, value: string | Date | undefined) => (
    <div className="qc-field">
      <span className="qc-field-label">{label}</span>
      <span className="qc-field-value">
        {value instanceof Date ? formatDate(value) : value || '—'}
      </span>
    </div>
  );

  const renderInput = (label: string, value: string, onChange: (value: string) => void, type: string = 'text') => (
    <div className="qc-input-group">
      <label className="qc-input-label">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="qc-input"
      />
    </div>
  );

  if (loading && !employee) {
    return (
      <div className="qc-loading">
        <div className="qc-loading-spinner"></div>
        <p>Загрузка данных...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="qc-not-found">
        <p>Сотрудник не найден</p>
      </div>
    );
  }

  return (
    <div className="qc-layout">
      <div className="qc-header">
        <button onClick={() => navigate(`/personnel/${id}`)} className="qc-back-btn">
          <ArrowLeft size={20} />
        </button>

        <div className="qc-header-content">
          <h1 className="qc-title">Качественная характеристика</h1>
          <p className="qc-subtitle">{employee.full_name}</p>
        </div>

        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="qc-edit-btn">
            <Pencil size={16} />
            <span>Редактировать</span>
          </button>
        )}
      </div>

      {error && (
        <div className="qc-error">
          <p>{error}</p>
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit} className="qc-form">
          <div className="qc-grid">
            {renderInfoCard("Основная информация", <User size={20} />, (
              <>
                {renderInput("Личный номер", formData.personal_number || '',
                  (value) => handleFieldChange('personal_number', value))}
                {renderInput("Звание", formData.rank || '',
                  (value) => handleFieldChange('rank', value))}
                {renderInput("№ приказа по званию", formData.order_rank || '',
                  (value) => handleFieldChange('order_rank', value))}
              </>
            ))}

            {renderInfoCard("Стаж работы", <Briefcase size={20} />, (
              <>
                {renderInput("На работе с", formatDate(formData.date_start_work),
                  (value) => handleFieldChange('date_start_work', new Date(value)), "date")}
                {renderInput("Дата начала контракта", formData.contract_date || '',
                  (value) => handleFieldChange('contract_date', value))}
                {renderInput("Дата окончания контракта", formData.date_end_work || '',
                  (value) => handleFieldChange('date_end_work', value))}
              </>
            ))}

            {renderInfoCard("Допуск к ГТ", <Shield size={20} />, (
              <>
                {renderInput("Форма", formData.form_state_secrets || '',
                  (value) => handleFieldChange('form_state_secrets', value))}
                {renderInput("№ допуска", formData.number_state_secrets || '',
                  (value) => handleFieldChange('number_state_secrets', value))}
                {renderInput("Дата", formatDate(formData.data_state_secrets),
                  (value) => handleFieldChange('data_state_secrets', new Date(value)), "date")}
              </>
            ))}

            {renderInfoCard("Образование", <GraduationCap size={20} />, (
              <>
                {renderInput("Уровень", formData.education || '',
                  (value) => handleFieldChange('education', value))}
                {renderInput("Учебное заведение", formData.institution || '',
                  (value) => handleFieldChange('institution', value))}
                {renderInput("Год окончания", formatDate(formData.year_graduation),
                  (value) => handleFieldChange('year_graduation', new Date(value)), "date")}
              </>
            ))}

          </div>

          <div className="qc-actions">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="qc-cancel-btn"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="qc-save-btn"
              disabled={loading}
            >
              {loading ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        </form>
      ) : (
        <div className="qc-grid">
          {renderInfoCard("Основная информация", <User size={20} />, (
            <>
              {renderField("Личный номер", employee.personal_number)}
              {renderField("Звание", employee.rank)}
              {renderField("№ приказа по званию", employee.order_rank)}
            </>
          ))}

          {renderInfoCard("Стаж работы", <Briefcase size={20} />, (
            <>
              {renderField("На работе с", employee.date_start_work)}
              {renderField("Дата начала контракта", employee.contract_date)}
              {renderField("Дата окончания контракта", employee.date_end_work)}
            </>
          ))}

          {renderInfoCard("Допуск к ГТ", <Shield size={20} />, (
            <>
              {renderField("Форма", employee.form_state_secrets)}
              {renderField("№ допуска", employee.number_state_secrets)}
              {renderField("Дата", employee.data_state_secrets)}
            </>
          ))}

          {renderInfoCard("Образование", <GraduationCap size={20} />, (
            <>
              {renderField("Уровень", employee.education)}
              {renderField("Учебное заведение", employee.institution)}
              {renderField("Год окончания", employee.year_graduation)}
            </>
          ))}
        </div>
      )}
    </div>
  );
}