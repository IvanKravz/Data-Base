import React from 'react';
import { Person } from '../../../../../types';
import '.././style.css';

interface BasicInformationProps {
  formData: Person;
  onChange: (data: Partial<Person>) => void;
}

export function BasicInformation({ formData, onChange }: BasicInformationProps) {
  return (
    <div className="space-y-4">
      <div className="form-field-group">
        <label className="form-label">ФИО</label>
        <input
          type="text"
          required
          value={formData.full_name}
          onChange={(e) => onChange({ full_name: e.target.value })}
          className="form-input"
        />
      </div>

      <div className="form-field-group">
        <label className="form-label">Должность</label>
        <input
          type="text"
          required
          value={formData.position}
          onChange={(e) => onChange({ position: e.target.value })}
          className="form-input"
        />
      </div>

      <div className="form-field-group">
        <label className="form-label">Отдел</label>
        <input
          type="text"
          required
          value={formData.department}
          onChange={(e) => onChange({ department: e.target.value })}
          className="form-input"
        />
      </div>
    </div>
  );
}