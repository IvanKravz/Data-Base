import { useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { Employee } from '../../../../types';

interface EducationCardProps {
  formData?: Partial<Employee>;
  onChange?: (field: keyof Employee, value: string) => void;
  employee?: Employee;
  viewMode?: boolean;
}

export function EducationCard({ formData, onChange, employee, viewMode }: EducationCardProps) {
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

  const handleDateClick = (field: keyof Employee) => {
    setActiveDateField(field);
  };

  const handleDateChange = (field: keyof Employee, value: string) => {
    const formattedValue = formatDisplayDate(value);
    onChange?.(field, formattedValue);
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
          />
        ) : (
          <div 
            className="qc-input qc-date-display" 
            onClick={() => handleDateClick(field)}
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
          <GraduationCap size={20} />
        </div>
        <h3 className="qc-card-title">Образование</h3>
      </div>
      <div className="qc-card-content">
        {viewMode ? (
          <>
            {renderField("Уровень", employee?.education)}
            {renderField("Учебное заведение", employee?.institution)}
            {renderField("Год окончания", employee?.year_graduation)}
          </>
        ) : (
          <>
            {renderInput("Уровень", formData?.education || '', 'education')}
            {renderInput("Учебное заведение", formData?.institution || '', 'institution')}
            {renderDateInput("Год окончания", formData?.year_graduation, 'year_graduation')}
          </>
        )}
      </div>
    </div>
  );
}