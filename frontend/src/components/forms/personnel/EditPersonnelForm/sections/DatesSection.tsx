import { Employee } from '../../../../../types';
import '.././style.css';

interface DatesSectionProps {
  formData: Employee;
  onChange: (data: Partial<Employee>) => void;
}

export function DatesSection({ formData, onChange }: DatesSectionProps) {
  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return '';
    const [day, month, year] = dateString.split('-');
    return `${year}-${month}-${day}`;
  };

  const formatDateForServer = (dateString: string): string => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
  };

  return (
    <div className="form-grid-2col">
      <div className="form-field-group">
        <label className="form-label">Дата рождения</label>
        <input
          type="date"
          required
          value={formatDateForInput(formData.birth_date)}
          onChange={(e) => onChange({ birth_date: formatDateForServer(e.target.value) })}
          className="form-input"
        />
      </div>

      <div className="form-field-group">
        <label className="form-label">Дата контракта</label>
        <input
          type="date"
          required
          value={formatDateForInput(formData.contract_date)}
          onChange={(e) => onChange({ contract_date: formatDateForServer(e.target.value) })}
          className="form-input"
        />
      </div>
    </div>
  );
}