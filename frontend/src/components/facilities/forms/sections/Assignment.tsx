import React from 'react';
import { Building2 } from 'lucide-react';
import { Facility } from '../../../../types';
import '../EditFacilityForm.css';

interface AssignmentProps {
  formData: Partial<Facility>;
  onChange: (data: Partial<Facility>) => void;
  divisions: any[];
  isLoading: boolean;
}

export function Assignment({ formData, onChange, divisions, isLoading }: AssignmentProps) {
  // Находим текущее подразделение по ID из formData.division
  const currentDivision = divisions.find(d => d.id.toString() === formData.division?.toString());
  const subdivisions = currentDivision?.subdivisions || [];

  const handleDivisionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const divisionId = e.target.value;
    const selectedDivision = divisions.find(d => d.id.toString() === divisionId.toString());
    
    if (!selectedDivision) {
      console.error('Подразделение не найдено:', divisionId, 'в массиве:', divisions);
      return;
    }
    
    onChange({ 
      division: divisionId,
      subdivision: undefined,
      divisionData: selectedDivision,
      communication_posts: []
    });
  };

  const handleSubdivisionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ 
      subdivision: e.target.value,
      communication_posts: [] // Очищаем выбранные посты связи
    });
  };

  return (
    <div className="facility-card-edit">
      <div className="facility-card-header-edit">
        <Building2 size={20} />
        <h3 className="facility-card-title-edit">Принадлежность</h3>
      </div>
      <div className="facility-card-content-edit">
        <div className="facility-form-field-edit">
          <label className="facility-form-label-edit">
            Подразделение
          </label>
          <div className="facility-form-input-container-edit">
            <Building2 className="facility-form-icon-edit" />
            <select
              value={formData.division || ''}
              onChange={handleDivisionChange}
              className="facility-form-select-edit"
              disabled={isLoading}
            >
              <option value="">Выберите подразделение</option>
              {divisions.map(division => (
                <option key={division.id} value={division.id}>
                  {division.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {currentDivision && subdivisions.length > 0 && (
          <div className="facility-form-field-edit">
            <label className="facility-form-label-edit">
              Отделение
            </label>
            <div className="facility-form-input-container-edit">
              <Building2 className="facility-form-icon-edit" />
              <select
                value={formData.subdivision || ''}
                onChange={handleSubdivisionChange}
                className="facility-form-select-edit"
                disabled={isLoading}
              >
                <option value="">Выберите отделение</option>
                {subdivisions.map(subdivision => (
                  <option key={subdivision.id} value={subdivision.id}>
                    {subdivision.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}