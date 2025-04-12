import { useState } from 'react';
import { Shield } from 'lucide-react';
import { Employee } from '../../../../types';

interface SecurityClearanceCardProps {
  formData?: Partial<Employee>;
  onChange?: (field: keyof Employee, value: string) => void;
  employee?: Employee;
  viewMode?: boolean;
}

export function SecurityClearanceCard({ formData, onChange, employee, viewMode }: SecurityClearanceCardProps) {
  const [activeDateField, setActiveDateField] = useState<keyof Employee | null>(null);

  // Преобразует дату из формата БД (YYYY-MM-DD) в DD-MM-YYYY для отображения
  const formatDisplayDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '—';
    
    // Проверяем формат YYYY-MM-DD
    const isoFormat = /^(\d{4})-(\d{2})-(\d{2})$/;
    const match = dateString.match(isoFormat);
    
    if (match) {
      return `${match[3]}-${match[2]}-${match[1]}`; // DD-MM-YYYY
    }
    
    // Если дата уже в формате DD-MM-YYYY, оставляем как есть
    const displayFormat = /^(\d{2})-(\d{2})-(\d{4})$/;
    if (displayFormat.test(dateString)) return dateString;
    
    return dateString; // Возвращаем как есть, если не распознали формат
  };

  // Преобразует в формат для input[type="date"] (YYYY-MM-DD)
  const formatDateForInput = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    
    // Если дата в формате DD-MM-YYYY
    const displayFormat = /^(\d{2})-(\d{2})-(\d{4})$/;
    const displayMatch = dateString.match(displayFormat);
    
    if (displayMatch) {
      return `${displayMatch[3]}-${displayMatch[2]}-${displayMatch[1]}`; // YYYY-MM-DD
    }
    
    // Если дата уже в формате YYYY-MM-DD
    const isoFormat = /^(\d{4})-(\d{2})-(\d{2})$/;
    if (isoFormat.test(dateString)) return dateString;
    
    return '';
  };

  const handleDateClick = (field: keyof Employee) => {
    setActiveDateField(field);
  };

  const handleDateChange = (field: keyof Employee, value: string) => {
    // При изменении преобразуем обратно в DD-MM-YYYY
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
          <Shield size={20} />
        </div>
        <h3 className="qc-card-title">Допуск к ГТ</h3>
      </div>
      <div className="qc-card-content">
        {viewMode ? (
          <>
            {renderField("Форма", employee?.form_state_secrets)}
            {renderField("№ допуска", employee?.number_state_secrets)}
            {renderField("Дата", employee?.data_state_secrets)}
          </>
        ) : (
          <>
            {renderField("Форма", formData?.form_state_secrets)}
            {renderField("№ допуска", formData?.number_state_secrets)}
            {renderDateInput("Дата", formData?.data_state_secrets, 'data_state_secrets')}
          </>
        )}
      </div>
    </div>
  );
}