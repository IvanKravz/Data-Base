import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ArrowLeft, Pencil } from 'lucide-react';
import { updatePerson } from '../../../store/slices/personnelSlice';
import { Employee } from '../../../types';
import { employeesApi } from '../../../api';
import {
  BasicInfoCard,
  WorkExperienceCard,
  SecurityClearanceCard,
  EducationCard
} from './sections';
import { FormActions } from './sections/FormActions';
import './style.css';
import { getPermissions } from '../../../api/utils/permissions';

export function QualitativeCharacteristics() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<Partial<Employee>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = localStorage.getItem('accessToken');

  // Получаем состояние навигации
  const navigationState = location.state;

  // Проверка прав доступа для кнопки "Редактировать сотрудника"
  const canEditEmployee = useMemo(() => {
    const permissions = getPermissions();
    if (permissions && permissions.employees) {
      return permissions.employees.can_edit;
    }
    return false;
  }, []);

  // Загрузка данных сотрудника
  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const data = await employeesApi.getPersonById(token, id);
        setEmployee(data);

        // Сохраняем данные как есть (в формате YYYY-MM-DD)
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

  // Обработчик изменения полей
  const handleFieldChange = (field: keyof Employee, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Отправка формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (employee) {
        // Отправляем данные как есть (в формате YYYY-MM-DD)
        const updatedPerson = await employeesApi.updatePerson(
          token,
          employee.id,
          formData as Employee
        );

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

  // Исправляем обработчик возврата
  const handleBack = () => {
    // Всегда возвращаемся на страницу сотрудника
    // Используем явный путь вместо navigate(-1)
    navigate(`/personnel/${id}`, {
      state: navigationState?.originalState || null
    });
  };

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
        <button
          onClick={handleBack}
          className="qc-back-btn"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="qc-header-content">
          <h1 className="qc-title">Качественная характеристика</h1>
          <p className="qc-subtitle">{employee.full_name}</p>
        </div>

        {!isEditing && canEditEmployee && (
          <button
            onClick={() => setIsEditing(true)}
            className="qc-edit-btn"
          >
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
            <BasicInfoCard
              formData={formData}
              onChange={handleFieldChange}
            />
            <WorkExperienceCard
              formData={formData}
              onChange={handleFieldChange}
            />
            <SecurityClearanceCard
              formData={formData}
              onChange={handleFieldChange}
            />
            <EducationCard
              formData={formData}
              onChange={handleFieldChange}
            />
          </div>

          <FormActions
            onCancel={() => setIsEditing(false)}
            loading={loading}
          />
        </form>
      ) : (
        <div className="qc-grid">
          <BasicInfoCard
            employee={employee}
            viewMode
          />
          <WorkExperienceCard
            employee={{
              ...employee,
              date_start_work: employee.date_start_work,
              contract_date: employee.contract_date,
              date_end_work: employee.date_end_work
            }}
            viewMode
          />
          <SecurityClearanceCard
            employee={{
              ...employee,
              data_state_secrets: employee.data_state_secrets
            }}
            viewMode
          />
          <EducationCard
            employee={{
              ...employee,
              year_graduation: employee.year_graduation
            }}
            viewMode
          />
        </div>
      )}
    </div>
  );
}