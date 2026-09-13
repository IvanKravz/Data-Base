import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Employee } from '../../../../../types';
import '../style.css';
import { formatDateForInput, formatDisplayDate } from '../../../../../api/utils/dateFormatters';

interface DatesCardProps {
  formData: Employee;
  onChange: (data: Partial<Employee>) => void;
  readOnly?: boolean;
}

export function DatesCard({ formData, onChange, readOnly = false }: DatesCardProps) {
  const [activeDateField, setActiveDateField] = useState<'contract_date' | null>(null);

  const handleDateClick = (field: 'contract_date') => {
    if (readOnly) return;
    setActiveDateField(field);
  };

  const handleDateClose = () => {
    setActiveDateField(null);
  };

  const handleDateChange = (field: 'contract_date', value: string) => {
    onChange({ [field]: value });
  };

  return (
    <div className="ep-card">
      <div className="ep-card-header">
        <Calendar size={20} />
        <h3 className="ep-card-title">Даты</h3>
      </div>
      <div className="ep-card-content ep-dates-grid">
        <div className="ep-form-group">
          <label className="ep-form-label">Дата контракта</label>
          {activeDateField === 'contract_date' ? (
            <input
              type="date"
              required
              value={formatDateForInput(formData.contract_date)}
              onChange={(e) => handleDateChange('contract_date', e.target.value)}
              onBlur={handleDateClose}
              onKeyDown={(e) => e.key === 'Escape' && handleDateClose()}
              autoFocus
              className="ep-form-input"
              disabled={readOnly}
            />
          ) : (
            <div
              className={`ep-form-input ${!readOnly ? 'editable' : ''}`}
              onClick={() => handleDateClick('contract_date')}
              style={{ cursor: readOnly ? 'default' : 'pointer' }}
            >
              {formatDisplayDate(formData.contract_date)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}