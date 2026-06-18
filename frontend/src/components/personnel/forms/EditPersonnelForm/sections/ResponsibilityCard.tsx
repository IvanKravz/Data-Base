import React from 'react';
import { Employee } from '../../../../../types';
import { ShieldAlert } from 'lucide-react';
import '../style.css';

interface ResponsibilityCardProps {
  formData: Employee;
  onChange: (data: Partial<Employee>) => void;
  readOnlyBasic?: boolean;
  readOnlySha?: boolean;
}

export function ResponsibilityCard({ formData, onChange, readOnlyBasic = false, readOnlySha = false }: ResponsibilityCardProps) {
  return (
    <div className="ep-card">
      <div className="ep-card-header">
        <ShieldAlert size={20} />
        <h3 className="ep-card-title">Ответственность</h3>
      </div>
      <div className="ep-card-content">
        <div className="ep-checkbox-group">
          <input
            type="checkbox"
            id="isMaterialResponsible"
            checked={formData.is_material_responsible || false}
            onChange={(e) => !readOnlyBasic && onChange({ is_material_responsible: e.target.checked })}
            className="ep-checkbox"
            disabled={readOnlyBasic}
          />
          <label htmlFor="isMaterialResponsible" className="ep-checkbox-label">
            Материально ответственное лицо
          </label>
        </div>

        <div className="ep-checkbox-group">
          <input
            type="checkbox"
            id="isShaWorker"
            checked={formData.is_sha_worker || false}
            onChange={(e) => {
              if (readOnlySha) return;
              const isShaWorker = e.target.checked;
              onChange({
                is_sha_worker: isShaWorker,
                sha_details: isShaWorker ? formData.sha_details || {
                  start_date: '',
                  access_level: '1',
                  equipment_conclusions: []
                } : null
              });
            }}
            className="ep-checkbox"
            disabled={readOnlySha}
          />
          <label htmlFor="isShaWorker" className="ep-checkbox-label">
            ШаРаботник
          </label>
        </div>
      </div>
    </div>
  );
}