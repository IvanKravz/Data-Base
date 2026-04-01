// components/personnel/QualitativeCharacteristics/QualitativeCharacteristics.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store/store';
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
import { useAppPermissions } from '../../../api/utils/AppPermissionsContext';
import './style.css';

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

  const user = useSelector((state: RootState) => state.auth.user);
  const permissions = user?.permissions;

  const { personnelFilters } = useAppPermissions();

  const canViewEmployee = useMemo(() => 
    permissions?.models?.Employee?.includes('view') ?? false, [permissions]);
  const canEditEmployee = useMemo(() => 
    permissions?.models?.Employee?.includes('change') ?? false, [permissions]);

  // Проверка на полный доступ (нет фильтров)
  const canEditQualitative = useMemo(() => {
    const hasFilters = personnelFilters && Object.keys(personnelFilters).length > 0;
    return canEditEmployee && !hasFilters;
  }, [canEditEmployee, personnelFilters]);

  const navigationState = location.state;

  // Загрузка данных сотрудника
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

    if (canViewEmployee) {
      fetchEmployee();
    } else {
      setError('У вас нет прав для просмотра данных сотрудника');
      setLoading(false);
    }
  }, [token, id, canViewEmployee]);

  const handleFieldChange = (field: keyof Employee, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canEditQualitative) {
      setError('У вас нет прав для редактирования данных сотрудника');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (employee) {
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

  const handleBack = () => {
    navigate(`/personnel/${id}`, {
      state: navigationState?.originalState || null
    });
  };

  if (!canViewEmployee) {
    return (
      <div className="qc-not-found">
        <p>У вас нет прав для просмотра качественной характеристики</p>
      </div>
    );
  }

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

        {!isEditing && canEditQualitative && (
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
              canEdit={canEditQualitative}
            />
            <WorkExperienceCard
              formData={formData}
              onChange={handleFieldChange}
              canEdit={canEditQualitative}
            />
            <SecurityClearanceCard
              formData={formData}
              onChange={handleFieldChange}
              canEdit={canEditQualitative}
            />
            <EducationCard
              formData={formData}
              onChange={handleFieldChange}
              canEdit={canEditQualitative}
            />
          </div>

          <FormActions
            onCancel={() => setIsEditing(false)}
            loading={loading}
            canEdit={canEditQualitative}
          />
        </form>
      ) : (
        <div className="qc-grid">
          <BasicInfoCard
            employee={employee}
            viewMode
            canEdit={canEditQualitative}
          />
          <WorkExperienceCard
            employee={{
              ...employee,
              date_start_work: employee.date_start_work,
              contract_date: employee.contract_date,
              date_end_work: employee.date_end_work
            }}
            viewMode
            canEdit={canEditQualitative}
          />
          <SecurityClearanceCard
            employee={{
              ...employee,
              data_state_secrets: employee.data_state_secrets
            }}
            viewMode
            canEdit={canEditQualitative}
          />
          <EducationCard
            employee={{
              ...employee,
              year_graduation: employee.year_graduation
            }}
            viewMode
            canEdit={canEditQualitative}
          />
        </div>
      )}
    </div>
  );
}