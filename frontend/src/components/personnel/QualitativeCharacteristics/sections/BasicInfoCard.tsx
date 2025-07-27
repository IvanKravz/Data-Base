import React from 'react';
import { User } from 'lucide-react';
import { Employee } from '../../../../types';

interface BasicInfoCardProps {
  formData?: Partial<Employee>;
  onChange?: (field: keyof Employee, value: string) => void;
  employee?: Employee;
  viewMode?: boolean;
}

export function BasicInfoCard({ formData, onChange, employee, viewMode }: BasicInfoCardProps) {
  const renderField = (label: string, value: string | undefined) => (
    <div className="qc-field">
      <span className="qc-field-label">{label}</span>
      <span className="qc-field-value">{value || '—'}</span>
    </div>
  );

  const renderInput = (label: string, value: string, field: keyof Employee) => (
    <div className="qc-input-group">
      <label className="qc-input-label">{label}</label>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange?.(field, e.target.value)}
        className="qc-input"
      />
    </div>
  );

  return (
    <div className="qc-card">
      <div className="qc-card-header">
        <div className="qc-card-icon">
          <User size={20} />
        </div>
        <h3 className="qc-card-title">Основная информация</h3>
      </div>
      <div className="qc-card-content">
        {viewMode ? (
          <>
            {renderField("Личный номер", employee?.personal_number)}
            {renderField("№ приказа по званию", employee?.order_rank)}
          </>
        ) : (
          <>
            {renderInput("Личный номер", formData?.personal_number || '', 'personal_number')}
            {renderInput("№ приказа по званию", formData?.order_rank || '', 'order_rank')}
          </>
        )}
      </div>
    </div>
  );
}