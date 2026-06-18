// AffiliationCard.tsx
import React from 'react';
import { Employee, Division } from '../../../../../types';
import { Users } from 'lucide-react';
import '../style.css';

interface AffiliationCardProps {
  formData: Employee;
  divisions: Division[];
  onChange: (data: Partial<Employee>) => void;
  isTopManagement: boolean;
  showDivisionField: boolean;
  fixedDivision?: boolean;
  fixedSubdivision?: boolean;
  readOnly?: boolean;
}

export function AffiliationCard({
  formData,
  divisions,
  onChange,
  isTopManagement,
  showDivisionField,
  fixedDivision = false,
  fixedSubdivision = false,
  readOnly = false
}: AffiliationCardProps) {
  const currentDivision = formData.division
    ? divisions.find(d => String(d.id) === String(formData.division?.id))
    : null;

  const currentSubdivisions = currentDivision?.subdivisions || [];
  const hasSubdivisions = currentSubdivisions.length > 0;
  const isDivisionDisabled = fixedDivision || readOnly || isTopManagement;
  const isSubdivisionDisabled = fixedSubdivision || readOnly || isTopManagement;

  const handleDivisionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (fixedDivision || readOnly) return;
    const divisionId = Number(e.target.value);
    const selectedDivision = divisions.find(d => d.id === divisionId);
    onChange({
      division: selectedDivision ? { id: selectedDivision.id, name: selectedDivision.name } : null,
      subdivision: null
    });
  };

  const handleSubdivisionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (fixedSubdivision || readOnly) return;
    const subdivisionId = Number(e.target.value);
    const selectedSubdivision = currentSubdivisions.find(s => s.id === subdivisionId);
    onChange({
      subdivision: selectedSubdivision ? { id: selectedSubdivision.id, name: selectedSubdivision.name } : null
    });
  };

  return (
    <div className="ep-card">
      <div className="ep-card-header">
        <Users size={20} />
        <h3 className="ep-card-title">Принадлежность</h3>
      </div>
      <div className="ep-card-content">
        {showDivisionField && (
          <div className="ep-form-group">
            <label className="ep-form-label">Подразделение</label>
            <select
              value={formData.division?.id || ''}
              onChange={handleDivisionChange}
              className="ep-form-input"
              disabled={isDivisionDisabled}
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

        {showDivisionField && formData.division && hasSubdivisions && (
          <div className="ep-form-group">
            <label className="ep-form-label">Отделение</label>
            <select
              value={formData.subdivision?.id || ''}
              onChange={handleSubdivisionChange}
              className="ep-form-input"
              disabled={isSubdivisionDisabled}
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