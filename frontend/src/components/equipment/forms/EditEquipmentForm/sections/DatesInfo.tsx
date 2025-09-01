import React from 'react';
import { Equipment } from '../../../../../types';
import { CalendarDays, Calendar } from 'lucide-react';
import '../style.css';

interface DatesInfoProps {
  formData: Partial<Equipment>;
  onChange: (data: Partial<Equipment>) => void;
}

export function DatesInfo({ formData, onChange }: DatesInfoProps) {
  return (
    <div className="equipment-card-edit">
      <div className="equipment-card-header">
        <CalendarDays size={20} />
        <h3 className="equipment-card-title">Даты</h3>
      </div>
      <div className="equipment-card-content-edit">
        <div className="form-group">
          <label className="form-label">Дата производства
          </label>
          <input
            type="date"
            value={formData.manufacturing_date || ''}
            onChange={(e) => onChange({ manufacturing_date: e.target.value })}
            className="form-input-edit"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Дата ввода в эксплуатацию
          </label>
          <input
            type="date"
            value={formData.exploitation_date || ''}
            onChange={(e) => onChange({ exploitation_date: e.target.value })}
            className="form-input-edit"
          />
        </div>
      </div>
    </div>
  );
}