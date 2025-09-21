import React from 'react';
import { Equipment } from '../../../../../types';
import { Fingerprint, Barcode } from 'lucide-react';
import '../style.css';

interface IdentificationInfoProps {
  formData: Partial<Equipment>;
  onChange: (data: Partial<Equipment>) => void;
}

export function IdentificationInfo({ formData, onChange }: IdentificationInfoProps) {
  return (
    <div className="equipment-card-edit">
      <div className="equipment-card-header">
        <Fingerprint size={20} />
        <h3 className="equipment-card-title">Идентификационные данные</h3>
      </div>
      <div className="equipment-card-content-edit">
        <div className="form-group">
          <label className="form-label">Серийный номер
          </label>
          <input
            type="text"
            required
            value={formData.serial_number || ''}
            onChange={(e) => onChange({ serial_number: e.target.value })}
            className="form-input-edit"
            placeholder="Введите серийный номер"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Инвентарный номер</label>
          <input
            type="text"
            value={formData.inventory_number || ''}
            onChange={(e) => onChange({ inventory_number: e.target.value })}
            className="form-input-edit"
            placeholder="Введите инвентарный номер"
          />
        </div>
      </div>
    </div>
  );
}