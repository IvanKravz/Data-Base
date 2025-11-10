// AffiliationCard.tsx
import React from 'react';
import { Employee, Division } from '../../../../../types';
import '.././style.css';
import { Building2 } from 'lucide-react';

interface AffiliationCardProps {
  formData: Employee;
  divisions: Division[];
  onChange: (data: Partial<Employee>) => void;
  isTopManagement: boolean;
  showDivisionField: boolean;
  fixedDivision?: boolean; // Новый пропс
  fixedSubdivision?: boolean; // Новый пропс
}

export function AffiliationCard({ 
  formData, 
  divisions, 
  onChange, 
  isTopManagement, 
  showDivisionField,
  fixedDivision = false,
  fixedSubdivision = false 
}: AffiliationCardProps) {
  const currentDivision = formData.division
    ? divisions.find(d => d.id === formData.division.id)
    : null;

  const currentSubdivisions = currentDivision?.subdivisions || [];
  const hasSubdivisions = currentSubdivisions.length > 0;

  const handleDivisionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (fixedDivision) return; // Блокируем изменение если фиксировано
    
    const divisionId = Number(e.target.value);
    const selectedDivision = divisions.find(d => d.id === divisionId);

    onChange({
      division: selectedDivision ? { id: selectedDivision.id, name: selectedDivision.name } : null,
      subdivision: null
    });
  };

  const handleSubdivisionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (fixedSubdivision) return; // Блокируем изменение если фиксировано
    
    const subdivisionId = Number(e.target.value);
    const selectedSubdivision = currentSubdivisions.find(s => s.id === subdivisionId);

    onChange({
      subdivision: selectedSubdivision ? { id: selectedSubdivision.id, name: selectedSubdivision.name } : null
    });
  };

  return (
    <div className="personnel-card">
      <div className="personnel-card-header-edit">
        <Building2 size={20} />
        <h3 className="personnel-card-title">Принадлежность</h3>
      </div>
      <div className="personnel-card-content">
        {showDivisionField && (
          <div className="personnel-form-group">
            <label className="personnel-form-label">Подразделение</label>
            <select
              value={formData.division?.id || ''}
              onChange={handleDivisionChange}
              className="personnel-form-input"
              disabled={isTopManagement || fixedDivision} // Добавляем fixedDivision
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
              disabled={isTopManagement || fixedSubdivision}
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