import React from 'react';
import { Employee } from '../../../../../types';
import '.././style.css';
import { Phone } from 'lucide-react';

interface ContactInformationCardProps {
  formData: Employee;
  onChange: (data: Partial<Employee>) => void;
  readOnly?: boolean;
}

export function ContactInformationCard({ formData, onChange, readOnly = false }: ContactInformationCardProps) {
  return (
    <div className="personnel-card">
      <div className="personnel-card-header-edit">
        <Phone size={20} />
        <h3 className="personnel-card-title">Контактная информация</h3>
      </div>
      <div className="personnel-card-content">
        <div className="personnel-form-group">
          <label className="personnel-form-label">Личный телефон</label>
          <input
            type="tel"
            value={formData.personal_phone}
            onChange={(e) => !readOnly && onChange({ personal_phone: e.target.value })}
            className="personnel-form-input"
            disabled={readOnly}
          />
        </div>

        <div className="personnel-form-group">
          <label className="personnel-form-label">Рабочий телефон</label>
          <input
            type="tel"
            value={formData.work_phone}
            onChange={(e) => !readOnly && onChange({ work_phone: e.target.value })}
            className="personnel-form-input"
            disabled={readOnly}
          />
        </div>
      </div>
    </div>
  );
}