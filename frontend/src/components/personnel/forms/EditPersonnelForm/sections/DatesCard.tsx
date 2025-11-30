import { Calendar } from 'lucide-react';
import { Employee } from '../../../../../types';
import '.././style.css';

interface DatesCardProps {
  formData: Employee;
  onChange: (data: Partial<Employee>) => void;
}

export function DatesCard({ formData, onChange }: DatesCardProps) {
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
    <div className="personnel-card">
      <div className="personnel-card-header-edit">
        <Calendar size={20} />
        <h3 className="personnel-card-title">Даты</h3>
      </div>
      <div className="personnel-card-content personnel-dates-grid">
        <div className="personnel-form-group">
          <label className="personnel-form-label">Дата рождения</label>
          <input
            type="date"
            required
            value={formatDateForInput(formData.birth_date)}
            onChange={(e) => onChange({ birth_date: formatDateForServer(e.target.value) })}
            className="personnel-form-input"
          />
        </div>

        <div className="personnel-form-group">
          <label className="personnel-form-label">Дата контракта</label>
          <input
            type="date"
            required
            value={formatDateForInput(formData.contract_date)}
            onChange={(e) => onChange({ contract_date: formatDateForServer(e.target.value) })}
            className="personnel-form-input"
          />
        </div>
      </div>
    </div>
  );
}