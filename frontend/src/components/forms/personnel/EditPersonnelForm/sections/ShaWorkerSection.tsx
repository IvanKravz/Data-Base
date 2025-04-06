import { Plus, Trash2 } from 'lucide-react';
import { Employee } from '../../../../../types';
import '.././style.css';

interface ShaWorkerSectionProps {
  shaWorker: Employee['sha_details'];
  onChange: (data: Partial<Employee['sha_details']>) => void;
  onAddEquipment: () => void;
  onRemoveEquipment: (index: number) => void;
  onEquipmentChange: (index: number, field: 'equipment_type' | 'conclusion_number', value: string) => void;
}

export function ShaWorkerSection({
  shaWorker,
  onChange,
  onAddEquipment,
  onRemoveEquipment,
  onEquipmentChange
}: ShaWorkerSectionProps) {
  if (!shaWorker) return null;

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
    <div className="sha-worker-section">
      <div className="form-grid-2col">
        <div className="form-field-group">
          <label className="form-label">Дата начала</label>
          <input
            type="date"
            required
            value={formatDateForInput(shaWorker.start_date)}
            onChange={(e) => onChange({
              ...shaWorker,
              start_date: formatDateForServer(e.target.value)
            })}
            className="form-input"
          />
        </div>

        <div className="form-field-group">
          <label className="form-label">Форма допуска</label>
          <select
            required
            value={shaWorker.access_level}
            onChange={(e) => onChange({
              ...shaWorker,
              access_level: e.target.value as '1' | '2'
            })}
            className="form-input form-select"
          >
            <option value="1">1 класс</option>
            <option value="2">2 класс</option>
          </select>
        </div>
      </div>

      <div className="form-section">
        <div className="flex justify-between items-center">
          <h4 className="form-label">Техника и заключения</h4>
          <button
            type="button"
            onClick={onAddEquipment}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4" />
            <span>Добавить технику</span>
          </button>
        </div>

        <div className="space-y-4">
          {shaWorker.equipment_conclusions.map((item, index) => (
            <div key={index} className="equipment-card">
              <div className="form-grid-2col">
                <input
                  type="text"
                  required
                  value={item.equipment_type}
                  onChange={(e) => onEquipmentChange(index, 'equipment_type', e.target.value)}
                  placeholder="Тип техники"
                  className="form-input"
                />
                <input
                  type="text"
                  required
                  value={item.conclusion_number}
                  onChange={(e) => onEquipmentChange(index, 'conclusion_number', e.target.value)}
                  placeholder="Номер заключения"
                  className="form-input"
                />
              </div>
              <button
                type="button"
                onClick={() => onRemoveEquipment(index)}
                className="btn btn-icon btn-danger"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          {shaWorker.equipment_conclusions.length === 0 && (
            <div className="empty-list-message">
              <p>Добавьте типы техники и номера заключений</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}