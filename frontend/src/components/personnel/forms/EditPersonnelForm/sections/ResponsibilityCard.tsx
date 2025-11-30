import React from 'react';
import { Employee } from '../../../../../types';
import '.././style.css';
import { ShieldAlert } from 'lucide-react';

interface ResponsibilityCardProps {
  formData: Employee;
  onChange: (data: Partial<Employee>) => void;
}

export function ResponsibilityCard({ formData, onChange }: ResponsibilityCardProps) {
  return (
    <div className="personnel-card">
      <div className="personnel-card-header-edit">
        <ShieldAlert size={20} />
        <h3 className="personnel-card-title">Ответственность</h3>
      </div>
      <div className="personnel-card-content">
        <div className="personnel-checkbox-group">
          <input
            type="checkbox"
            id="isMaterialResponsible"
            checked={formData.is_material_responsible || false}
            onChange={(e) => onChange({ is_material_responsible: e.target.checked })}
            className="personnel-checkbox"
          />
          <label htmlFor="isMaterialResponsible" className="personnel-checkbox-label">
            Материально ответственное лицо
          </label>
        </div>

        <div className="personnel-checkbox-group">
          <input
            type="checkbox"
            id="isShaWorker"
            checked={formData.is_sha_worker || false}
            onChange={(e) => {
              const isShaWorker = e.target.checked;
              onChange({
                is_sha_worker: isShaWorker,
                // Если снимаем галочку, явно устанавливаем sha_details в null
                sha_details: isShaWorker ? formData.sha_details || {
                  start_date: '',
                  access_level: '1',
                  equipment_conclusions: []
                } : null
              });
            }}
            className="personnel-checkbox"
          />
          <label htmlFor="isShaWorker" className="personnel-checkbox-label">
            ШаРаботник
          </label>
        </div>
      </div>
    </div>
  );
}