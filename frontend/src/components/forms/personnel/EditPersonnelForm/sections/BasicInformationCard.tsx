import React, { useEffect, useState } from 'react';
import { Employee, Division, Subdivision } from '../../../../../types';
import '.././style.css';
import { employeesApi } from '../../../../../api';

interface BasicInformationCardProps {
  formData: Employee;
  divisions: Division[];
  onChange: (data: Partial<Employee>) => void;
  token: string;
}

interface EmployeeDictionaries {
  categories: { value: string; label: string }[];
  officer_positions: { value: string; label: string }[];
  warrant_officer_positions: { value: string; label: string }[];
  civilian_positions: { value: string; label: string }[];
  management_officer_ranks: { value: string; label: string }[];
  officer_ranks: { value: string; label: string }[];
  warrant_officer_ranks: { value: string; label: string }[];
}

export function BasicInformationCard({ formData, divisions, onChange, token }: BasicInformationCardProps) {
  const [dictionaries, setDictionaries] = useState<EmployeeDictionaries>({
    categories: [],
    officer_positions: [],
    warrant_officer_positions: [],
    civilian_positions: [],
    officer_ranks: [],
    warrant_officer_ranks: []
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDictionaries = async () => {
      try {
        const data = await employeesApi.getDictionaries(token);
        setDictionaries(data);
      } catch (error) {
        console.error('Failed to load dictionaries:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDictionaries();
  }, [token]);

  const currentDivision = formData.division
    ? divisions.find(d => d.id === formData.division.id)
    : null;

  const currentSubdivisions = currentDivision?.subdivisions || [];
  const hasSubdivisions = currentSubdivisions.length > 0;

  const isManagement = formData.category === 'management';
  const isOfficer = formData.category === 'officer';
  const isWarrantOfficer = formData.category === 'warrant_officer';
  const isCivilian = formData.category === 'civilian';

  // Определяем, является ли сотрудник топ-руководством
  const isTopManagement = isManagement &&
    (formData.position === 'Главный руководитель' ||
      formData.position === 'Заместитель главного руководителя');

  // Показываем поле подразделения, если:
  // - это не руководство ИЛИ
  // - это руководство, но не топ-руководство (не главный руководитель и не заместитель)
  const showDivisionField = !isManagement ||
    (isManagement && !isTopManagement);

  const showRankField = !isCivilian;

  const getPositionsForCategory = () => {
    switch (formData.category) {
      case 'management':
        return [
          { value: 'Главный руководитель', label: 'Главный руководитель' },
          { value: 'Заместитель главного руководителя', label: 'Заместитель главного руководителя' },
          { value: 'Начальник отдела', label: 'Начальник отдела' },
          { value: 'Заместитель начальника отдела', label: 'Заместитель начальника отдела' },
          { value: 'Начальник отделения', label: 'Начальник отделения' }
        ];
      case 'officer':
        return dictionaries.officer_positions;
      case 'warrant_officer':
        return dictionaries.warrant_officer_positions;
      case 'civilian':
        return dictionaries.civilian_positions;
      default:
        return [];
    }
  };

  const getRanksForCategory = () => {
    switch (formData.category) {
      case 'management':
        return dictionaries.management_officer_ranks;
      case 'officer':
        return dictionaries.officer_ranks;
      case 'warrant_officer':
        return dictionaries.warrant_officer_ranks;
      default:
        return [];
    }
  };

  const handleDivisionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const divisionId = Number(e.target.value);
    const selectedDivision = divisions.find(d => d.id === divisionId);

    onChange({
      division: selectedDivision ? { id: selectedDivision.id, name: selectedDivision.name } : null,
      subdivision: null
    });
  };

  const handleSubdivisionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subdivisionId = Number(e.target.value);
    const selectedSubdivision = currentSubdivisions.find(s => s.id === subdivisionId);

    onChange({
      subdivision: selectedSubdivision ? { id: selectedSubdivision.id, name: selectedSubdivision.name } : null
    });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value;
    let updateData: Partial<Employee> = {
      category,
      position: '',
      rank: ''
    };

    // Если выбрана категория "Руководство", сбрасываем подразделение только для топ-руководства
    if (category === 'management') {
      updateData = {
        ...updateData,
        // Не сбрасываем подразделение здесь, это будет сделано при выборе позиции
      };
    }

    onChange(updateData);
  };

  const handlePositionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const position = e.target.value;
    let updateData: Partial<Employee> = {
      position,
      // Сбрасываем подразделение только для главного руководителя и его заместителя
      ...(position === 'Главный руководитель' || position === 'Заместитель главного руководителя') && {
        division: null,
        subdivision: null
      }
    };

    onChange(updateData);
  };

  const handleRankChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      rank: e.target.value,
      order_rank: '' // Сохраняем существующее значение или пустую строку
    });
  };

  if (loading) {
    return <div>Загрузка справочников...</div>;
  }

  return (
    <div className="personnel-card">
      <h3 className="personnel-card-title">Основная информация</h3>
      <div className="personnel-card-content">
        <div className="personnel-form-group">
          <label className="personnel-form-label">ФИО</label>
          <input
            type="text"
            required
            value={formData.full_name}
            onChange={(e) => onChange({ full_name: e.target.value })}
            className="personnel-form-input"
          />
        </div>

        <div className="personnel-form-group">
          <label className="personnel-form-label">Категория</label>
          <select
            value={formData.category || ''}
            onChange={handleCategoryChange}
            className="personnel-form-input"
          >
            <option value="">Выберите категорию</option>
            {dictionaries.categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        {(isManagement || isOfficer || isWarrantOfficer || isCivilian) && (
          <div className="personnel-form-group">
            <label className="personnel-form-label">Должность</label>
            <select
              value={formData.position || ''}
              onChange={handlePositionChange}
              className="personnel-form-input"
              required
            >
              <option value="">Выберите должность</option>
              {getPositionsForCategory().map((position) => (
                <option key={position.value} value={position.value}>
                  {position.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {showRankField && (
          <div className="personnel-form-group">
            <label className="personnel-form-label">Звание</label>
            <select
              value={formData.rank || ''}
              onChange={handleRankChange}
              className="personnel-form-input"
            >
              <option value="">Выберите звание</option>
              {getRanksForCategory().map((rank) => (
                <option key={rank.value} value={rank.value}>
                  {rank.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {showDivisionField && (
          <div className="personnel-form-group">
            <label className="personnel-form-label">Подразделение</label>
            <select
              value={formData.division?.id || ''}
              onChange={handleDivisionChange}
              className="personnel-form-input"
              disabled={isTopManagement}
            >
              <option value="">Выберите подразделение</option>
              {divisions.map((division) => (
                <option key={division.id} value={division.id}>
                  {division.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {showDivisionField && hasSubdivisions && formData.division && (
          <div className="personnel-form-group">
            <label className="personnel-form-label">Отделение</label>
            <select
              value={formData.subdivision?.id || ''}
              onChange={handleSubdivisionChange}
              className="personnel-form-input"
              disabled={isTopManagement}
            >
              <option value="">Выберите отделение</option>
              {currentSubdivisions.map((subdivision) => (
                <option key={subdivision.id} value={subdivision.id}>
                  {subdivision.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}