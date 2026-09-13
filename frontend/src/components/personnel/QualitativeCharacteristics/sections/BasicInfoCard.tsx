import React, { useMemo } from 'react';
import { User, Hash, FileText } from 'lucide-react';
import { Employee } from '../../../../types';

interface BasicInfoCardProps {
  formData?: Partial<Employee>;
  onChange?: (field: keyof Employee, value: string) => void;
  employee?: Employee;
  viewMode?: boolean;
  canEdit?: boolean;
  searchTerm?: string;
}

export function BasicInfoCard({ formData, onChange, employee, viewMode, canEdit = true, searchTerm = '' }: BasicInfoCardProps) {
  const fields = useMemo(() => {
    if (viewMode) {
      return [
        { label: 'Личный номер', value: employee?.personal_number || '—', icon: Hash, key: 'personal_number' },
        { label: '№ приказа по званию', value: employee?.order_rank || '—', icon: FileText, key: 'order_rank' },
      ];
    } else {
      return [
        { label: 'Личный номер', value: formData?.personal_number || '', icon: Hash, key: 'personal_number' },
        { label: '№ приказа по званию', value: formData?.order_rank || '', icon: FileText, key: 'order_rank' },
      ];
    }
  }, [viewMode, employee, formData]);

  const filteredFields = useMemo(() => {
    if (!searchTerm.trim()) return fields;
    const lower = searchTerm.toLowerCase().trim();
    return fields.filter(f =>
      f.label.toLowerCase().includes(lower) ||
      (f.value && f.value.toLowerCase().includes(lower))
    );
  }, [fields, searchTerm]);

  if (filteredFields.length === 0) {
    return null;
  }

  const renderField = (label: string, value: string, icon: React.ElementType, key: string) => {
    const Icon = icon;
    return (
      <div className="qc-info-item" key={key}>
        <Icon className="qc-info-icon" size={20} />
        <div>
          <p className="qc-info-label">{label}</p>
          <p className="qc-info-value">{value}</p>
        </div>
      </div>
    );
  };

  const renderInput = (label: string, value: string, field: keyof Employee, icon: React.ElementType, key: string) => {
    const Icon = icon;
    return (
      <div className="qc-input-group" key={key}>
        <label className="qc-input-label">
          <Icon size={16} className="qc-info-icon" />
          {label}
        </label>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange?.(field, e.target.value)}
          className="qc-input"
          disabled={!canEdit}
        />
      </div>
    );
  };

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
          filteredFields.map(f => renderField(f.label, f.value, f.icon, f.key))
        ) : (
          filteredFields.map(f => renderInput(f.label, f.value, f.key as keyof Employee, f.icon, f.key))
        )}
      </div>
    </div>
  );
}