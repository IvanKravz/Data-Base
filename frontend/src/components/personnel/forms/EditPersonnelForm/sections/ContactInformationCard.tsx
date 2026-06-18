import React from 'react';
import { Employee } from '../../../../../types';
import { Phone } from 'lucide-react';
import '../style.css';

interface ContactInformationCardProps {
  formData: Employee;
  onChange: (data: Partial<Employee>) => void;
  readOnly?: boolean;
}

export function ContactInformationCard({ formData, onChange, readOnly = false }: ContactInformationCardProps) {
  return (
    <div className="ep-card">
      <div className="ep-card-header">
        <Phone size={20} />
        <h3 className="ep-card-title">Контактная информация</h3>
      </div>
      <div className="ep-card-content">
        <div className="ep-form-group">
          <label className="ep-form-label">Личный телефон</label>
          <input
            type="tel"
            value={formData.personal_phone}
            onChange={(e) => !readOnly && onChange({ personal_phone: e.target.value })}
            className="ep-form-input"
            disabled={readOnly}
          />
        </div>

        <div className="ep-form-group">
          <label className="ep-form-label">Рабочий телефон</label>
          <input
            type="tel"
            value={formData.work_phone}
            onChange={(e) => !readOnly && onChange({ work_phone: e.target.value })}
            className="ep-form-input"
            disabled={readOnly}
          />
        </div>
      </div>
    </div>
  );
}