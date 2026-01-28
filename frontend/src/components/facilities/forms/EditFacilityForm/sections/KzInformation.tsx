import React from 'react';
import { Ruler } from 'lucide-react';
import { Facility } from '../../../../../types';
import '../EditFacilityForm.css';

interface KzInformationProps {
  formData: Facility;
  onChange: (data: Partial<Facility>) => void;
}

export function KzInformation({ formData, onChange }: KzInformationProps) {
  return (
    <div className="facility-form-edit-card">
      <div className="facility-form-edit-card-header">
        <Ruler size={20} />
        <h3 className="facility-form-edit-card-title">Информация о КЗ</h3>
      </div>
      <div className="facility-form-edit-card-content">
        <div className="facility-form-edit-field">
          <label className="facility-form-edit-label">
            Размер КЗ
          </label>
          <div className="facility-form-edit-input-container">
            <Ruler className="facility-form-edit-icon" />
            <input
              type="text"
              value={formData.kz_size  || ''}
              onChange={(e) => onChange({ kz_size : e.target.value })}
              className="facility-form-edit-input"
              placeholder="Введите размер КЗ"
            />
          </div>
        </div>

        <div className="facility-form-edit-field">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.has_transformer_in_kz || false}
              onChange={(e) => onChange({ has_transformer_in_kz: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">ТП в пределах КЗ</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.has_grounding_in_kz || false}
              onChange={(e) => onChange({ has_grounding_in_kz: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Контур заземления в пределах КЗ</span>
          </label>
        </div>
      </div>
    </div>
  );
}
