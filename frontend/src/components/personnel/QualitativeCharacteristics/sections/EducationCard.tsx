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

  // Преобразует дату из формата БД (YYYY-MM-DD) в DD-MM-YYYY
  const formatDateDisplay = (dateString: string | null | undefined): string => {
    if (!dateString) return '—';

    // Проверяем формат YYYY-MM-DD
    const isoFormat = /^(\d{4})-(\d{2})-(\d{2})$/;
    const match = dateString.match(isoFormat);

    if (match) {
      return `${match[3]}-${match[2]}-${match[1]}`; // DD-MM-YYYY
    }

    // Если дата в другом формате, пытаемся распарсить
    const dateObj = new Date(dateString);
    if (!isNaN(dateObj.getTime())) {
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();
      return `${day}-${month}-${year}`;
    }

    return dateString; // Возвращаем как есть, если не смогли распарсить
  };

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

    // Проверяем формат DD-MM-YYYY
    const displayFormat = /^(\d{2})-(\d{2})-(\d{4})$/;
    const match = dateString.match(displayFormat);

    if (match) {
      return `${match[3]}-${match[2]}-${match[1]}`; // YYYY-MM-DD
    }

    // Проверяем формат YYYY-MM-DD
    const isoFormat = /^(\d{4})-(\d{2})-(\d{2})$/;
    if (isoFormat.test(dateString)) return dateString;

    // Пытаемся распарсить другие форматы
    const dateObj = new Date(dateString);
    if (!isNaN(dateObj.getTime())) {
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    return '';
  };

  const handleDateClick = (field: keyof Employee) => {
    setActiveDateField(field);
  };

  const handleDateChange = (field: keyof Employee, value: string) => {
    // Сохраняем в формате DD-MM-YYYY
    const formattedValue = formatDateDisplay(value);
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
            {renderField("Уровень", formData?.education)}
            {renderField("Учебное заведение", formData?.institution)}
            {renderDateInput("Год окончания", formData?.year_graduation || '', 'year_graduation')}
          </>
        )}
      </div>
    </div>
  );
}