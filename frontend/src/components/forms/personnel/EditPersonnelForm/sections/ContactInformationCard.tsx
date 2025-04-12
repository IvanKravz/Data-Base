import React from 'react';
import { Employee } from '../../../../../types';
import { divisions } from '../../../../../data/divisionsData';
import '.././style.css';

interface ContactInformationCardProps {
  formData: Employee;
  onChange: (data: Partial<Employee>) => void;
}

export function ContactInformationCard({ formData, onChange }: ContactInformationCardProps) {
  return (
    <div className="personnel-card">
      <h3 className="personnel-card-title">Контактная информация</h3>
      <div className="personnel-card-content">
        <div className="personnel-form-group">
          <label className="personnel-form-label">Личный телефон</label>
          <input
            type="tel"
            required
            value={formData.personal_phone}
            onChange={(e) => onChange({ personal_phone: e.target.value })}
            className="personnel-form-input"
          />
        </div>

        <div className="personnel-form-group">
          <label className="personnel-form-label">Рабочий телефон</label>
          <input
            type="tel"
            required
            value={formData.work_phone}
            onChange={(e) => onChange({ work_phone: e.target.value })}
            className="personnel-form-input"
          />
        </div>
      </div>
    </div>
  );
}