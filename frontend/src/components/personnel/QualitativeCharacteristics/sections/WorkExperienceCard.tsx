import { useState } from 'react';
import { Briefcase } from 'lucide-react';
import { Employee } from '../../../../types';

interface WorkExperienceCardProps {
  formData?: Partial<Employee>;
  onChange?: (field: keyof Employee, value: string) => void;
  employee?: Employee;
  viewMode?: boolean;
  canEdit?: boolean;
}

export function WorkExperienceCard({ formData, onChange, employee, viewMode, canEdit = true }: WorkExperienceCardProps) {
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

  const handleDateClick = (field: keyof Employee) => {
    if (!canEdit) return;
    setActiveDateField(field);
  };

  const handleDateChange = (field: keyof Employee, value: string) => {
    onChange?.(field, value);
    setActiveDateField(null);
  };

  const renderField = (label: string, value: string | undefined) => (
    <div className="qc-field">
      <span className="qc-field-label">{label}</span>
      <span className="qc-field-value">
        {value ? formatDisplayDate(value) : '—'}
      </span>
    </div>
  );

  const formatDateForInput = (dateString: string | null | undefined): string => {
    if (!dateString) return '';

    const displayFormat = /^(\d{2})-(\d{2})-(\d{4})$/;
    const displayMatch = dateString.match(displayFormat);

    if (displayMatch) {
      return `${displayMatch[3]}-${displayMatch[2]}-${displayMatch[1]}`;
    }

    const isoFormat = /^(\d{4})-(\d{2})-(\d{2})$/;
    if (isoFormat.test(dateString)) return dateString;

    return '';
  };

  const renderDateInput = (label: string, value: string | undefined, field: keyof Employee) => {
    const displayValue = value ? formatDisplayDate(value) : 'дд-мм-гггг';
    const inputValue = value ? formatDateForInput(value) : '';

    return (
      <div className="qc-input-group">
        <label className="qc-input-label">{label}</label>
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

  if (!viewMode && !canEdit) {
    return null;
  }

  return (
    <div className="qc-card">
      <div className="qc-card-header">
        <div className="qc-card-icon">
          <Briefcase size={20} />
        </div>
        <h3 className="qc-card-title">Стаж работы</h3>
      </div>
      <div className="qc-card-content">
        {viewMode ? (
          <>
            {renderField("На работе с", employee?.date_start_work)}
            {renderField("Дата начала контракта", employee?.contract_date)}
            {renderField("Дата окончания контракта", employee?.date_end_work)}
          </>
        ) : (
          <>
            {renderDateInput("На работе с", formData?.date_start_work, 'date_start_work')}
            {renderDateInput("Дата начала контракта", formData?.contract_date, 'contract_date')}
            {renderDateInput("Дата окончания контракта", formData?.date_end_work, 'date_end_work')}
          </>
        )}
      </div>
    </div>
  );
}