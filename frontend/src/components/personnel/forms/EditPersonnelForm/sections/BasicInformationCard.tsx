// BasicInformationCard.tsx
import React, { useEffect, useState } from 'react';
import { Employee } from '../../../../../types';
import { employeesApi } from '../../../../../api';
import { User, ShieldCheck, KeyRound } from 'lucide-react';
import { formatDateForInput, formatDisplayDate } from '../../../../../api/utils/dateFormatters';
import '../style.css';

interface BasicInformationCardProps {
  formData: Employee;
  onChange: (data: Partial<Employee>) => void;
  token: string;
  readOnly?: boolean;
  readOnlySha?: boolean;
}

interface EmployeeDictionaries {
  categories: { value: string; label: string }[];
  officer_positions: { value: string; label: string }[];
  warrant_officer_positions: { value: string; label: string }[];
  civilian_positions: { value: string; label: string }[];
  management_positions: { value: string; label: string }[];
  management_officer_ranks: { value: string; label: string }[];
  officer_ranks: { value: string; label: string }[];
  warrant_officer_ranks: { value: string; label: string }[];
}

export function BasicInformationCard({
  formData,
  onChange,
  token,
  readOnly = false,
  readOnlySha = false,
}: BasicInformationCardProps) {
  const [dictionaries, setDictionaries] = useState<EmployeeDictionaries>({
    categories: [],
    officer_positions: [],
    warrant_officer_positions: [],
    civilian_positions: [],
    management_positions: [],
    management_officer_ranks: [],
    officer_ranks: [],
    warrant_officer_ranks: [],
  });

  const [loading, setLoading] = useState(true);
  const [activeDateField, setActiveDateField] = useState<'birth_date' | null>(null);

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
        return dictionaries.management_positions;
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

  const handleMaterialResponsibleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;
    onChange({ is_material_responsible: e.target.checked });
  };

  const handleShaWorkerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnlySha) return;
    const isShaWorker = e.target.checked;
    onChange({
      is_sha_worker: isShaWorker,
      sha_details: isShaWorker
        ? formData.sha_details || {
            start_date: new Date().toISOString().split('T')[0],
            access_level: '1',
            equipment_conclusions: [],
          }
        : null,
    });
  };

  const handleDateClick = () => {
    if (readOnly) return;
    setActiveDateField('birth_date');
  };

  const handleDateClose = () => {
    setActiveDateField(null);
  };

  const handleDateChange = (value: string) => {
    onChange({ birth_date: value });
  };

  return (
    <div className="ep-card">
      <div className="ep-card-header">
        <User size={20} />
        <h3 className="ep-card-title">Основная информация</h3>
      </div>
      <div className="ep-card-content">
        {/* ФИО */}
        <div className="ep-form-group">
          <label className="ep-form-label">ФИО</label>
          <input
            type="text"
            required
            value={formData.full_name}
            onChange={(e) => !readOnly && onChange({ full_name: e.target.value })}
            className="ep-form-input"
            disabled={readOnly}
          />
        </div>

        {/* Дата рождения */}
        <div className="ep-form-group">
          <label className="ep-form-label">Дата рождения</label>
          {activeDateField === 'birth_date' ? (
            <input
              type="date"
              value={formatDateForInput(formData.birth_date)}
              onChange={(e) => handleDateChange(e.target.value)}
              onBlur={handleDateClose}
              onKeyDown={(e) => e.key === 'Escape' && handleDateClose()}
              autoFocus
              className="ep-form-input"
              disabled={readOnly}
            />
          ) : (
            <div
              className={`ep-form-input ${!readOnly ? 'editable' : ''}`}
              onClick={handleDateClick}
              style={{ cursor: readOnly ? 'default' : 'pointer' }}
            >
              {formatDisplayDate(formData.birth_date)}
            </div>
          )}
        </div>

        {/* Категория */}
        <div className="ep-form-group">
          <label className="ep-form-label">Категория</label>
          <select
            value={formData.category || ''}
            onChange={handleCategoryChange}
            className="ep-form-input"
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

        {/* Должность */}
        {(isManagement || isOfficer || isWarrantOfficer || isCivilian) && (
          <div className="ep-form-group ep-fade-in">
            <label className="ep-form-label">Должность</label>
            <select
              value={formData.position || ''}
              onChange={handlePositionChange}
              className="ep-form-input"
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

        {/* Звание */}
        {showRankField && (
          <div className="ep-form-group ep-fade-in">
            <label className="ep-form-label">Звание</label>
            <select
              value={formData.rank || ''}
              onChange={handleRankChange}
              className="ep-form-input"
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

        <hr className="ep-divider" />

        <div className="ep-checkbox-group-wrapper">
          <div className="ep-checkbox-group ep-fade-in">
            <input
              type="checkbox"
              id="isMaterialResponsible"
              checked={formData.is_material_responsible || false}
              onChange={handleMaterialResponsibleChange}
              className="ep-checkbox"
              disabled={readOnly}
            />
            <label htmlFor="isMaterialResponsible" className="ep-checkbox-label">
              <ShieldCheck size={16} />
              Материально ответственное лицо
              {formData.is_material_responsible && (
                <span className="ep-status-badge ep-status-badge--mol">МОЛ</span>
              )}
            </label>
          </div>

          <div className="ep-checkbox-group ep-fade-in">
            <input
              type="checkbox"
              id="isShaWorker"
              checked={formData.is_sha_worker || false}
              onChange={handleShaWorkerChange}
              className="ep-checkbox"
              disabled={readOnlySha}
            />
            <label htmlFor="isShaWorker" className="ep-checkbox-label">
              <KeyRound size={16} />
              ШаРаботник
              {formData.is_sha_worker && (
                <span className="ep-status-badge ep-status-badge--sha">ШР</span>
              )}
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}