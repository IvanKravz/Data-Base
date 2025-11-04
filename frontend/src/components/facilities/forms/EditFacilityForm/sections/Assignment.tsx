import React from 'react';
import { Building2 } from 'lucide-react';
import { Facility } from '../../../../../types';
import '../EditFacilityForm.css';

interface AssignmentProps {
  formData: Partial<Facility>;
  onChange: (data: Partial<Facility>) => void;
  divisions: any[];
  availableSubdivisions: any[];
  isLoading: boolean;
}

export function Assignment({ 
  formData, 
  onChange, 
  divisions, 
  availableSubdivisions,
  isLoading
}: AssignmentProps) {

  const handleDivisionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const divisionId = e.target.value;
    
    // Если выбрано пустое значение, сбрасываем подразделение
    if (!divisionId) {
      onChange({ 
        division: undefined,
        subdivision: undefined,
        communication_posts: []
      });
      return;
    }
    
    const selectedDivision = divisions.find(d => d.id == divisionId);
    
    if (!selectedDivision) {
      console.error('Подразделение не найдено:', divisionId, 'в массиве:', divisions);
      return;
    }
    
    onChange({ 
      division: selectedDivision,
      subdivision: undefined,
      communication_posts: []
    });
  };

  const handleSubdivisionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subdivisionId = e.target.value;
    
    // Если выбрано пустое значение, сбрасываем отделение
    if (!subdivisionId) {
      onChange({ 
        subdivision: undefined,
        communication_posts: []
      });
      return;
    }
    
    // Находим полный объект подразделения по ID
    const selectedSubdivision = availableSubdivisions.find(s => s.id == subdivisionId);
    
    onChange({ 
      subdivision: selectedSubdivision || undefined,
      communication_posts: []
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
              value={formData.division?.id || ''}
              onChange={handleDivisionChange}
              className="facility-form-select-edit"
              disabled={isLoading}
              required // Делаем поле обязательным
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

        {formData.division && availableSubdivisions.length > 0 && (
          <div className="facility-form-field-edit">
            <label className="facility-form-label-edit">
              Отделение
            </label>
            <div className="facility-form-input-container-edit">
              <Building2 className="facility-form-icon-edit" />
              <select
                value={formData.subdivision?.id || ''}
                onChange={handleSubdivisionChange}
                className="facility-form-select-edit"
                disabled={isLoading}
              >
                <option value="">Выберите отделение</option>
                {availableSubdivisions.map(subdivision => (
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