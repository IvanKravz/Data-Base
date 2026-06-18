import { useState, useMemo } from 'react';
import { Shield, Hash, Calendar } from 'lucide-react';
import { Employee } from '../../../../types';

interface SecurityClearanceCardProps {
  formData?: Partial<Employee>;
  onChange?: (field: keyof Employee, value: string) => void;
  employee?: Employee;
  viewMode?: boolean;
  canEdit?: boolean;
  searchTerm?: string;
}

export function SecurityClearanceCard({ formData, onChange, employee, viewMode, canEdit = true, searchTerm = '' }: SecurityClearanceCardProps) {
  const [activeDateField, setActiveDateField] = useState<keyof Employee | null>(null);

  const formatDisplayDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '—';
    const isoFormat = /^(\d{4})-(\d{2})-(\d{2})$/;
    const match = dateString.match(isoFormat);
    if (match) {
      return `${match[3]}-${match[2]}-${match[1]}`;
    }
    const displayFormat = /^(\d{2})-(\d{2})-(\d{4})$/;
    if (displayFormat.test(dateString)) return dateString;
    return dateString;
  };

  const formatDateForInput = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    const displayFormat = /^(\d{2})-(\d{2})-(\d{4})$/;
    const match = dateString.match(displayFormat);
    if (match) {
      return `${match[3]}-${match[2]}-${match[1]}`;
    }
    const isoFormat = /^(\d{4})-(\d{2})-(\d{2})$/;
    if (isoFormat.test(dateString)) return dateString;
    return '';
  };

  const fields = useMemo(() => {
    if (viewMode) {
      return [
        { label: 'Форма', value: employee?.form_state_secrets || '—', icon: Shield, key: 'form_state_secrets' },
        { label: '№ допуска', value: employee?.number_state_secrets || '—', icon: Hash, key: 'number_state_secrets' },
        { label: 'Дата', value: employee?.data_state_secrets ? formatDisplayDate(employee.data_state_secrets) : '—', icon: Calendar, key: 'data_state_secrets' },
      ];
    } else {
      return [
        { label: 'Форма', value: formData?.form_state_secrets || '', icon: Shield, key: 'form_state_secrets' },
        { label: '№ допуска', value: formData?.number_state_secrets || '', icon: Hash, key: 'number_state_secrets' },
        { label: 'Дата', value: formData?.data_state_secrets || '', icon: Calendar, key: 'data_state_secrets' },
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

  const handleDateClick = (field: keyof Employee) => {
    if (!canEdit) return;
    setActiveDateField(field);
  };

  const handleDateChange = (field: keyof Employee, value: string) => {
    onChange?.(field, value);
    setActiveDateField(null);
  };

  const renderField = (label: string, value: string, icon: React.ElementType) => {
    const Icon = icon;
    return (
      <div className="qc-info-item">
        <Icon className="qc-info-icon" size={20} />
        <div>
          <p className="qc-info-label">{label}</p>
          <p className="qc-info-value">{value}</p>
        </div>
      </div>
    );
  };

  const renderInput = (label: string, value: string, field: keyof Employee, icon: React.ElementType) => {
    const Icon = icon;
    return (
      <div className="qc-input-group">
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

  const renderDateInput = (label: string, value: string | undefined, field: keyof Employee, icon: React.ElementType) => {
    const Icon = icon;
    const displayValue = value ? formatDisplayDate(value) : 'дд-мм-гггг';
    const inputValue = value ? formatDateForInput(value) : '';

    return (
      <div className="qc-input-group">
        <label className="qc-input-label">
          <Icon size={16} className="qc-info-icon" />
          {label}
        </label>
        {activeDateField === field ? (
          <input
            type="date"
            value={inputValue}
            onChange={(e) => handleDateChange(field, e.target.value)}
            onBlur={() => setActiveDateField(null)}
            autoFocus
            className="qc-input"
            disabled={!canEdit}
          />
        ) : (
          <div
            className={`qc-input qc-date-display ${canEdit ? 'editable' : ''}`}
            onClick={() => handleDateClick(field)}
            style={{ cursor: canEdit ? 'pointer' : 'default' }}
          >
            {displayValue}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="qc-card">
      <div className="qc-card-header">
        <div className="qc-card-icon">
          <Shield size={20} />
        </div>
        <h3 className="qc-card-title">Допуск к ГТ</h3>
      </div>
      <div className="qc-card-content">
        {viewMode ? (
          filteredFields.map(f => renderField(f.label, f.value, f.icon))
        ) : (
          filteredFields.map(f => {
            if (f.key === 'data_state_secrets') {
              return renderDateInput(f.label, formData?.data_state_secrets, 'data_state_secrets', Calendar);
            }
            return renderInput(f.label, f.value, f.key as keyof Employee, f.icon);
          })
        )}
      </div>
    </div>
  );
}