import React from 'react';
import { Equipment } from '../../../../../types';
import { CalendarDays } from 'lucide-react';
import '../style.css';

interface DatesInfoProps {
  formData: Partial<Equipment>;
  onChange: (data: Partial<Equipment>) => void;
  serviceLife?: string;
  onServiceLifeChange: (value: string) => void;
  isDisposed?: boolean;
}

export function DatesInfo({
  formData,
  onChange,
  serviceLife,
  onServiceLifeChange,
  isDisposed = false
}: DatesInfoProps) {
  return (
    <div className="equipment-card-edit">
      <div className="equipment-card-header">
        <CalendarDays size={20} />
        <h3 className="equipment-card-title">Даты</h3>
      </div>
      <div className="equipment-card-content-edit">

        <div className="equipment-form-group">
          <label className="equipment-form-label">Дата производства</label>
          <input
            type="date"
            value={formData.manufacturing_date || ''}
            onChange={(e) => onChange({ manufacturing_date: e.target.value })}
            className="form-input-edit"
            disabled={isDisposed}
          />
        </div>

        <div className="equipment-form-group">
          <label className="equipment-form-label">Дата ввода в эксплуатацию</label>
          <input
            type="date"
            value={formData.exploitation_date || ''}
            onChange={(e) => onChange({ exploitation_date: e.target.value })}
            className="form-input-edit"
            disabled={isDisposed}
          />
        </div>


        <div className="form-row">
          <div className="equipment-form-group">
            <label className="equipment-form-label">Срок службы</label>
            <input
              type="text"
              value={serviceLife || ''}
              onChange={(e) => onServiceLifeChange(e.target.value)}
              className="form-input-edit"
              placeholder="Например, 5 лет"
              disabled={isDisposed}
            />
          </div>
        </div>
      </div>
    </div>
  );
}