import { useState, useMemo } from 'react';
import { Briefcase, Calendar, CalendarClock } from 'lucide-react';
import { Employee } from '../../../../types';
import { formatDisplayDate, formatDateForInput } from '../../../../api/utils/dateFormatters';


interface WorkExperienceCardProps {
  formData?: Partial<Employee>;
  onChange?: (field: keyof Employee, value: string) => void;
  employee?: Employee;
  viewMode?: boolean;
  canEdit?: boolean;
  searchTerm?: string;
}

export function WorkExperienceCard({ formData, onChange, employee, viewMode, canEdit = true, searchTerm = '' }: WorkExperienceCardProps) {
  const [activeDateField, setActiveDateField] = useState<keyof Employee | null>(null);

  const fields = useMemo(() => {
    if (viewMode) {
      return [
        { label: 'На работе с', value: employee?.date_start_work ? formatDisplayDate(employee.date_start_work) : '—', icon: Calendar, key: 'date_start_work' },
        { label: 'Дата начала контракта', value: employee?.contract_date ? formatDisplayDate(employee.contract_date) : '—', icon: CalendarClock, key: 'contract_date' },
        { label: 'Дата окончания контракта', value: employee?.date_end_work ? formatDisplayDate(employee.date_end_work) : '—', icon: CalendarClock, key: 'date_end_work' },
      ];
    } else {
      return [
        { label: 'На работе с', value: formData?.date_start_work || '', icon: Calendar, key: 'date_start_work' },
        { label: 'Дата начала контракта', value: formData?.contract_date || '', icon: CalendarClock, key: 'contract_date' },
        { label: 'Дата окончания контракта', value: formData?.date_end_work || '', icon: CalendarClock, key: 'date_end_work' },
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

  const handleDateClose = () => {
    setActiveDateField(null);
  };

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

  const renderDateInput = (label: string, value: string | undefined, field: keyof Employee, icon: React.ElementType, key: string) => {
    const Icon = icon;
    const displayValue = value ? formatDisplayDate(value) : 'дд.мм.гггг';
    const inputValue = value ? formatDateForInput(value) : '';

    return (
      <div className="qc-input-group" key={key}>
        <label className="qc-input-label">
          <Icon size={16} className="qc-info-icon" />
          {label}
        </label>
        {activeDateField === field ? (
          <input
            type="date"
            value={inputValue}
            onChange={(e) => onChange?.(field, e.target.value)}
            onBlur={handleDateClose}
            onKeyDown={(e) => e.key === 'Escape' && handleDateClose()}
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
          <Briefcase size={20} />
        </div>
        <h3 className="qc-card-title">Стаж работы</h3>
      </div>
      <div className="qc-card-content">
        {viewMode ? (
          filteredFields.map(f => renderField(f.label, f.value, f.icon, f.key))
        ) : (
          filteredFields.map(f => renderDateInput(f.label, formData?.[f.key as keyof Employee] as string, f.key as keyof Employee, f.icon, f.key))
        )}
      </div>
    </div>
  );
}