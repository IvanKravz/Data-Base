import React from 'react';
import { Employee } from '../../../../../types';
import '.././style.css';

interface BasicInformationCardProps {
  formData: Employee;
  divisions: Division[]; // Добавляем тип для divisions
  onChange: (data: Partial<Employee>) => void;
}

interface Division {
  id: number;
  name: string;
  subdivisions: Subdivision[];
}

interface Subdivision {
  id: number;
  name: string;
}

export function BasicInformationCard({ formData, divisions, onChange }: BasicInformationCardProps) {
  console.log('formData', formData);

  // Находим выбранное подразделение
  const selectedDivision = divisions.find(div => div.name === formData.division);
  
  // Получаем список подразделений для выбранного подразделения
  const subdivisions = selectedDivision?.subdivisions || [];

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
          <label className="personnel-form-label">Должность</label>
          <input
            type="text"
            required
            value={formData.position}
            onChange={(e) => onChange({ position: e.target.value })}
            className="personnel-form-input"
          />
        </div>

        <div className="personnel-form-group">
          <label className="personnel-form-label">Подразделение</label>
          <select
            value={formData.division}
            onChange={(e) => onChange({
              division: e.target.value,
              subdivision: undefined
            })}
            className="personnel-form-input"
          >
            {divisions.map((division) => (
              <option key={division.id} value={division.name}>
                {division.name}
              </option>
            ))}
          </select>
        </div>

        {subdivisions.length > 0 && (
          <div className="personnel-form-group">
            <label className="personnel-form-label">Отделение</label>
            <select
              value={formData.subdivision || ''}
              onChange={(e) => onChange({ subdivision: e.target.value })}
              className="personnel-form-input"
            >
              <option value="">Выберите отделение</option>
              {subdivisions.map((subdivision) => (
                <option key={subdivision.id} value={subdivision.name}>
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