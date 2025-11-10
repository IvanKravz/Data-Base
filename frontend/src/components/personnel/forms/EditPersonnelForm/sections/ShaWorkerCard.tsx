import { Building2, Plus, Trash2 } from 'lucide-react';
import { Employee } from '../../../../../types';
import '.././style.css';

interface ShaWorkerCardProps {
  shaWorker: Employee['sha_details'];
  onChange: (data: Partial<Employee['sha_details']>) => void;
  onAddEquipment: () => void;
  onRemoveEquipment: (index: number) => void;
  onEquipmentChange: (index: number, field: 'equipment_type' | 'conclusion_number', value: string) => void;
}

export function ShaWorkerCard({
  shaWorker,
  onChange,
  onAddEquipment,
  onRemoveEquipment,
  onEquipmentChange
}: ShaWorkerCardProps) {
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
    <div className="personnel-card sha-worker-card">
      <div className="personnel-card-header-edit">
        <Building2 size={20} />
        <h3 className="personnel-card-title">Данные ШаРаботника</h3>
      </div>
      <div className="personnel-card-content">
        <div className="sha-worker-grid">
          <div className="personnel-form-group">
            <label className="personnel-form-label">Дата начала</label>
            <input
              type="date"
              required
              value={formatDateForInput(shaWorker.start_date)}
              onChange={(e) => onChange({
                ...shaWorker,
                start_date: formatDateForServer(e.target.value)
              })}
              className="personnel-form-input"
            />
          </div>

          <div className="personnel-form-group">
            <label className="personnel-form-label">Форма допуска</label>
            <select
              required
              value={shaWorker.access_level}
              onChange={(e) => onChange({
                ...shaWorker,
                access_level: e.target.value as '1' | '2'
              })}
              className="personnel-form-input"
            >
              <option value="1">1 класс</option>
              <option value="2">2 класс</option>
            </select>
          </div>
        </div>

        <div className="sha-equipment-section">
          <div className="sha-equipment-header">
            <h4 className="personnel-form-label">Техника и заключения</h4>
            <button
              type="button"
              onClick={onAddEquipment}
              className="personnel-btn personnel-btn-primary personnel-btn-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Добавить технику</span>
            </button>
          </div>

          <div className="sha-equipment-list">
            {shaWorker.equipment_conclusions.map((item, index) => (
              <div key={index} className="sha-equipment-item">
                <div className="sha-equipment-fields">
                  <input
                    type="text"
                    required
                    value={item.equipment_type}
                    onChange={(e) => onEquipmentChange(index, 'equipment_type', e.target.value)}
                    placeholder="Тип техники"
                    className="personnel-form-input"
                  />
                  <input
                    type="text"
                    required
                    value={item.conclusion_number}
                    onChange={(e) => onEquipmentChange(index, 'conclusion_number', e.target.value)}
                    placeholder="Номер заключения"
                    className="personnel-form-input"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveEquipment(index)}
                  className="personnel-btn personnel-btn-danger personnel-btn-icon"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            {shaWorker.equipment_conclusions.length === 0 && (
              <div className="sha-equipment-empty">
                <p>Добавьте типы техники и номера заключений</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}