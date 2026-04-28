import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { EditPersonnelForm } from '../EditPersonnelForm';
import { Employee } from '../../../../types';
import { employeesApi } from '../../../../api';
import { ArrowLeft } from 'lucide-react';

export function CreatePersonnelForm() {
  const { id: paramDivisionId } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem('accessToken');
  const [error, setError] = useState<string | null>(null);

  // Парсим query-параметры (например, ?subdivision=123)
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const subdivisionIdFromUrl = searchParams.get('subdivision');

  // Получаем данные из state навигации (передаются из списка сотрудников)
  const navigationState = location.state as {
    divisionId?: string;
    subdivisionId?: string;
    divisionName?: string;
    subdivisionName?: string;
    fromSubdivision?: boolean;
  } | undefined;

  // Определяем итоговые ID подразделения и отделения
  const effectiveDivisionId = paramDivisionId || navigationState?.divisionId;
  const effectiveSubdivisionId = navigationState?.subdivisionId || subdivisionIdFromUrl;
  const fromSubdivision = navigationState?.fromSubdivision || false;

  // Флаг глобального режима (нет привязки к подразделению)
  const isGlobalMode = !effectiveDivisionId;

  // Фиксированные объекты для передачи в форму
  const fixedDivision = effectiveDivisionId
    ? { id: effectiveDivisionId, name: navigationState?.divisionName || '' }
    : null;
  const fixedSubdivision = effectiveSubdivisionId && fromSubdivision
    ? { id: effectiveSubdivisionId, name: navigationState?.subdivisionName || '' }
    : null;

  // Начальные данные сотрудника (без id)
  const initialEmployee: Omit<Employee, 'id'> & { id?: number } = {
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
  };

  const handleCreate = async (employee: Employee) => {
    if (!token) {
      setError('Отсутствует токен авторизации');
      return;
    }

    setError(null);

    try {
      // Удаляем id перед отправкой (на случай, если он вдруг появился)
      const { id: _, ...employeeWithoutId } = employee;
      const createdEmployee = await employeesApi.createPerson(token, employeeWithoutId);

      if (createdEmployee?.id) {
        // Определяем, куда вернуться
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
        setError('Не удалось создать сотрудника. Неверный ответ сервера.');
      }
    } catch (err: any) {
      console.error('Ошибка создания сотрудника:', err);
      const errorData = err.response?.data;
      if (errorData && typeof errorData === 'object') {
        const messages = Object.entries(errorData)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join('\n');
        setError(`Ошибка валидации:\n${messages}`);
      } else {
        setError('Не удалось создать сотрудника. Проверьте введенные данные.');
      }
    }
  };

  const handleCancel = () => {
    if (isGlobalMode) {
      navigate('/personnel');
    } else if (effectiveDivisionId) {
      const url = effectiveSubdivisionId && fromSubdivision
        ? `/divisions/${effectiveDivisionId}/personnel?subdivision=${effectiveSubdivisionId}`
        : `/divisions/${effectiveDivisionId}/personnel`;
      navigate(url);
    } else {
      navigate('/personnel');
    }
  };

  return (
    <div className="personnel-edit-page">
      <div className="page-title">
        <button onClick={handleCancel} className="back-button">
          <ArrowLeft className="back-button-icon" />
        </button>
        Создание нового сотрудника
      </div>

      {error && (
        <div className="form-error-message" style={{ whiteSpace: 'pre-line' }}>
          {error}
        </div>
      )}

      <EditPersonnelForm
        person={initialEmployee as Employee}
        onSubmit={handleCreate}
        onCancel={handleCancel}
        isCreateMode={true}
        fixedDivision={!!fixedDivision}
        fixedSubdivision={!!fixedSubdivision}
      />
    </div>
  );
}