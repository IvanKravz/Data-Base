import { KeyRound, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Employee } from '../../../../../types';
import '../style.css';
import { formatDateForInput, formatDisplayDate } from '../../../../../api/utils/dateFormatters';

interface ShaWorkerCardProps {
  shaWorker: Employee['sha_details'];
  onChange: (data: Partial<Employee['sha_details']>) => void;
  onAddEquipment: () => void;
  onRemoveEquipment: (index: number) => void;
  onEquipmentChange: (index: number, field: 'equipment_type' | 'conclusion_number', value: string) => void;
  readOnly?: boolean;
}

export function ShaWorkerCard({
  shaWorker,
  onChange,
  onAddEquipment,
  onRemoveEquipment,
  onEquipmentChange,
  readOnly = false
}: ShaWorkerCardProps) {
  const [activeDateField, setActiveDateField] = useState<'start_date' | null>(null);

  if (!shaWorker) return null;

  const handleDateClick = () => {
    if (readOnly) return;
    setActiveDateField('start_date');
  };

  const handleDateClose = () => {
    setActiveDateField(null);
  };

  const handleDateChange = (value: string) => {
    onChange({
      ...shaWorker,
      start_date: value
    });
  };

  return (
    <div className="ep-card ep-sha-card">
      <div className="ep-card-header">
        <KeyRound size={20} />
        <h3 className="ep-card-title">Данные ШаРаботника</h3>
      </div>
      <div className="ep-card-content">
        <div className="ep-sha-grid">
          <div className="ep-form-group">
            <label className="ep-form-label">Дата начала</label>
            {activeDateField === 'start_date' ? (
              <input
                type="date"
                required
                value={formatDateForInput(shaWorker.start_date)}
                onChange={(e) => handleDateChange(e.target.value)}
                onBlur={handleDateClose}
                onKeyDown={(e) => e.key === 'Escape' && handleDateClose()}
                autoFocus
                className="ep-form-input"
                disabled={readOnly}
              />
            ) : (
              <div
                className={`ep-form-input ${!readOnly ? 'editable' : ''}`}
                onClick={handleDateClick}
                style={{ cursor: readOnly ? 'default' : 'pointer' }}
              >
                {formatDisplayDate(shaWorker.start_date)}
              </div>
            )}
          </div>

          <div className="ep-form-group">
            <label className="ep-form-label">Форма допуска</label>
            <select
              required
              value={shaWorker.access_level}
              onChange={(e) => !readOnly && onChange({
                ...shaWorker,
                access_level: e.target.value as '1' | '2'
              })}
              className="ep-form-input"
              disabled={readOnly}
            >
              <option value="1">1 класс</option>
              <option value="2">2 класс</option>
            </select>
          </div>
        </div>

        <div className="ep-sha-equipment-section">
          <div className="ep-sha-equipment-header">
            <h4 className="ep-form-label">Техника и заключения</h4>
            {!readOnly && (
              <button
                type="button"
                onClick={onAddEquipment}
                className="ep-btn ep-btn-primary ep-btn-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Добавить технику</span>
              </button>
            )}
          </div>

          <div className="ep-sha-equipment-list">
            {shaWorker.equipment_conclusions.map((item, index) => {
              const type = item.equipment_type.trim();
              const number = item.conclusion_number.trim();
              const typeError = type === '' && number !== '';
              const numberError = number === '' && type !== '';

              return (
                <div key={index} className="ep-sha-equipment-item">
                  <div className="ep-sha-equipment-fields">
                    <input
                      type="text"
                      required
                      value={item.equipment_type}
                      onChange={(e) => !readOnly && onEquipmentChange(index, 'equipment_type', e.target.value)}
                      placeholder="Тип техники"
                      className={`ep-form-input ${typeError ? 'ep-form-input-error' : ''}`}
                      disabled={readOnly}
                    />
                    <input
                      type="text"
                      required
                      value={item.conclusion_number}
                      onChange={(e) => !readOnly && onEquipmentChange(index, 'conclusion_number', e.target.value)}
                      placeholder="Номер заключения"
                      className={`ep-form-input ${numberError ? 'ep-form-input-error' : ''}`}
                      disabled={readOnly}
                    />
                  </div>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => onRemoveEquipment(index)}
                      className="ep-btn ep-btn-danger ep-btn-icon"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}

            {shaWorker.equipment_conclusions.length === 0 && (
              <div className="ep-sha-equipment-empty">
                <p>Добавьте типы техники и номера заключений</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}