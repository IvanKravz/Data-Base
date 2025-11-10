import React from 'react';
import { Equipment } from '../../../../../types';
import { FileText, ClipboardList } from 'lucide-react';
import '../style.css';

interface DocumentsInfoProps {
  formData: Partial<Equipment>;
  onChange: (data: Partial<Equipment>) => void;
  isDisposed?: boolean;
}

export function DocumentsInfo({
  formData,
  onChange,
  isDisposed = false,
}: DocumentsInfoProps) {
  return (
    <div className="equipment-card-edit">
      <div className="equipment-card-header">
        <FileText size={20} />
        <h3 className="equipment-card-title">Документы</h3>
      </div>
      <div className="equipment-card-content-edit">
        <div className="equipment-form-group">
          <label className="equipment-form-label">Первичный документ</label>
          <input
            type="text"
            value={formData.first_invoice || ''}
            onChange={(e) => onChange({ first_invoice: e.target.value })}
            className="form-input-edit"
            placeholder="Номер первичного документа"
            disabled={isDisposed}
          />
        </div>

        <div className="equipment-form-group">
          <label className="equipment-form-label">Накладная на МОЛ</label>
          <input
            type="text"
            value={formData.material_invoice || ''}
            onChange={(e) => onChange({ material_invoice: e.target.value })}
            className="form-input-edit"
            placeholder="Номер накладной на МОЛ"
            disabled={isDisposed}
          />
        </div>
      </div>
    </div>
  );
}