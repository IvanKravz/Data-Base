import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EditPersonnelForm } from '../EditPersonnelForm';
import { Employee } from '../../../../types';
import { employeesApi } from '../../../../api';
import { ArrowLeft } from 'lucide-react';

export function CreatePersonnelForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const token = localStorage.getItem('accessToken');
  const [error, setError] = useState<string | null>(null); // Добавлено состояние ошибки

  // Начальные данные для нового сотрудника
  const initialEmployee: Employee = {
    id: 0,
    full_name: '',
    personal_phone: '',
    work_phone: '',
    birth_date: '',
    contract_date: '',
    category: '',
    position: '',
    rank: '',
    is_material_responsible: false,
    is_sha_worker: false,
    description: null,
    division: id ? { id: parseInt(id), name: '' } : null,
    subdivision: null,
    sha_details: null,
    // Добавлены поля, которые сервер требует для всех сотрудников
    data_state_secrets: null,
    date_end_work: null,
    date_start_work: null,
    year_graduation: null
  };

  const handleCreate = async (employee: Employee) => {
    if (!token) {
      setError('Отсутствует токен авторизации');
      return;
    }
  
    setError(null);
  
    try {
      const createdEmployee = await employeesApi.createPerson(token, employee);
      
      // Проверяем что сотрудник создан и id подразделения доступен
      if (createdEmployee && createdEmployee.id) {
        // Используем id из созданного сотрудника (createdEmployee.division.id)
        // или из URL параметров, если division не вернулся
        const divisionId = createdEmployee.division?.id || id;
        
        if (divisionId) {
          navigate(`/divisions/${divisionId}/personnel`);
        } else {
          // Если divisionId не определен, переходим на общую страницу
          navigate('/divisions');
        }
      } else {
        setError('Не удалось создать сотрудника. Неверный ответ сервера.');
      }
    } catch (error) {
      console.error('Ошибка создания сотрудника:', error);
      setError('Не удалось создать сотрудника. Проверьте введенные данные.');
    }
  };

  return (
    <div className="personnel-edit-page">
      <div className="page-title">
        <button
          onClick={() => navigate(-1)}
          className="back-button"
        >
          <ArrowLeft className="back-button-icon" />
        </button>
        Создание нового сотрудника
      </div>

      {/* Отображение ошибки */}
      {error && (
        <div className="form-error-message">
          {error}
        </div>
      )}

      <EditPersonnelForm
        person={initialEmployee}
        onSubmit={handleCreate}
        onCancel={() => navigate(-1)}
        isCreateMode={true}
      />
    </div>
  );
}