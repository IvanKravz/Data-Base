// BasicInformationCard.tsx
import React, { useEffect, useState } from 'react';
import { Employee } from '../../../../../types';
import '.././style.css';
import { employeesApi } from '../../../../../api';
import { User } from 'lucide-react';

interface BasicInformationCardProps {
  formData: Employee;
  onChange: (data: Partial<Employee>) => void;
  token: string;
  readOnly?: boolean;
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

export function BasicInformationCard({ formData, onChange, token, readOnly = false }: BasicInformationCardProps) {
  const [dictionaries, setDictionaries] = useState<EmployeeDictionaries>({
    categories: [],
    officer_positions: [],
    warrant_officer_positions: [],
    civilian_positions: [],
    officer_ranks: [],
    warrant_officer_ranks: [],
    management_officer_ranks: []
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

  const isManagement = formData.category === 'management';
  const isOfficer = formData.category === 'officer';
  const isWarrantOfficer = formData.category === 'warrant_officer';
  const isCivilian = formData.category === 'civilian';
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

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (readOnly) return;
    const category = e.target.value;
    onChange({ category, position: '', rank: '' });
  };

  const handlePositionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (readOnly) return;
    const position = e.target.value;
    let updateData: Partial<Employee> = { position };
    if (position === 'Главный руководитель' || position === 'Заместитель главного руководителя') {
      updateData = { ...updateData, division: null, subdivision: null };
    }
    onChange(updateData);
  };

  const handleRankChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (readOnly) return;
    onChange({ rank: e.target.value, order_rank: '' });
  };

  return (
    <div className="personnel-card">
      <div className="personnel-card-header-edit">
        <User size={20} />
        <h3 className="personnel-card-title">Основная информация</h3>
      </div>
      <div className="personnel-card-content">
        <div className="personnel-form-group">
          <label className="personnel-form-label">ФИО</label>
          <input
            type="text"
            required
            value={formData.full_name}
            onChange={(e) => !readOnly && onChange({ full_name: e.target.value })}
            className="personnel-form-input"
            disabled={readOnly}
          />
        </div>

        <div className="personnel-form-group">
          <label className="personnel-form-label">Категория</label>
          <select
            value={formData.category || ''}
            onChange={handleCategoryChange}
            className="personnel-form-input"
            disabled={readOnly}
            required
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
              disabled={readOnly}
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
              disabled={readOnly}
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
      </div>
    </div>
  );
}