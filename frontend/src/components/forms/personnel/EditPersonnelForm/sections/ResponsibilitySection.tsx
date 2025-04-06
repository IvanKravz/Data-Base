import React from 'react';
import { Person } from '../../../../../types';
import '.././style.css';

interface ResponsibilitySectionProps {
  formData: Person;
  onChange: (data: Partial<Person>) => void;
}

export function ResponsibilitySection({ formData, onChange }: ResponsibilitySectionProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isMaterialResponsible"
          checked={formData.is_material_responsible || false}
          onChange={(e) => onChange({ is_material_responsible: e.target.checked })}
          className="form-checkbox"
        />
        <label htmlFor="isMaterialResponsible" className="form-label">
          Материально ответственное лицо
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isShaWorker"
          checked={formData.is_sha_worker || false}
          onChange={(e) => onChange({
            is_sha_worker: e.target.checked,
            sha_details: e.target.checked ? formData.sha_details || {
              start_date: '',
              access_level: '1',
              equipment_conclusions: []
            } : undefined
          })}
          className="form-checkbox"
        />
        <label htmlFor="isShaWorker" className="form-label">
          ШаРаботник
        </label>
      </div>
    </div>
  );
}