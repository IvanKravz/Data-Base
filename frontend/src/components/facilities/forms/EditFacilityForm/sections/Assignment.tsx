import React, { useCallback } from 'react';
import { Building2 } from 'lucide-react';
import { Facility } from '../../../../../types';
import '../EditFacilityForm.css';

interface AssignmentProps {
  formData: Partial<Facility>;
  onChange: (data: Partial<Facility>) => void;
  divisions: any[];
  availableSubdivisions: any[];
  isLoading: boolean;
  fixedDivision?: boolean;
  fixedSubdivision?: boolean;
}

export function Assignment({ 
  formData, 
  onChange, 
  divisions, 
  availableSubdivisions = [],
  isLoading,
  fixedDivision = false,
  fixedSubdivision = false
}: AssignmentProps) {

  // ИСПРАВЛЕНИЕ: useCallback для обработчиков
  const handleDivisionChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    if (fixedDivision) return;
    
    const divisionId = e.target.value;
    
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
  }, [fixedDivision, divisions, onChange]);

  const handleSubdivisionChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    if (fixedSubdivision) return;
    
    const subdivisionId = e.target.value;
    
    if (!subdivisionId) {
      onChange({ 
        subdivision: undefined,
        communication_posts: []
      });
      return;
    }
    
    const selectedSubdivision = availableSubdivisions.find(s => s.id == subdivisionId);
    
    onChange({ 
      subdivision: selectedSubdivision || undefined,
      communication_posts: []
    });
  }, [fixedSubdivision, availableSubdivisions, onChange]);

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
              disabled={isLoading || fixedDivision}
              required
            >
              <option value="">Выберите подразделение</option>
              {divisions.map(division => (
                <option key={division.id} value={division.id}>
                  {division.name}
                </option>
              ))}
            </select>
          </div>
          {fixedDivision && (
            <div className="text-xs text-gray-500 mt-1">
              Подразделение автоматически заполнено из текущего контекста
            </div>
          )}
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
                disabled={isLoading || fixedSubdivision}
              >
                <option value="">Выберите отделение</option>
                {availableSubdivisions.map(subdivision => (
                  <option key={subdivision.id} value={subdivision.id}>
                    {subdivision.name}
                  </option>
                ))}
              </select>
            </div>
            {fixedSubdivision && (
              <div className="text-xs text-gray-500 mt-1">
                Отделение автоматически заполнено из текущего контекста
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}