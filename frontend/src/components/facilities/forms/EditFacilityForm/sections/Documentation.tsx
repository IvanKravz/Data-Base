import React from 'react';
import { FileText } from 'lucide-react';
import { Facility } from '../../../../../types';
import '../EditFacilityForm.css';

interface DocumentationProps {
  formData: Partial<Facility>;
  onChange: (data: Partial<Facility>) => void;
}

export function Documentation({ formData, onChange }: DocumentationProps) {
  return (
    <div className="facility-form-edit-card">
      <div className="facility-form-edit-card-header">
        <FileText size={20} />
        <h3 className="facility-form-edit-card-title">Документация</h3>
      </div>
      <div className="facility-form-edit-card-content">
          <div className="facility-form-edit-field">
            <label className="facility-form-edit-label">
              Номер акта приемки помещения
            </label>
            <div className="facility-form-edit-input-container">
              <FileText className="facility-form-edit-icon" />
              <input
                type="text"
                value={formData.acceptance_act_number || ''}
                onChange={(e) => onChange({ acceptance_act_number: e.target.value })}
                className="facility-form-edit-input"
                placeholder="Введите номер акта"
              />
            </div>
          </div>

          <div className="facility-form-edit-field">
            <label className="facility-form-edit-label">
              Номер акта РИМ
            </label>
            <div className="facility-form-edit-input-container">
              <FileText className="facility-form-edit-icon" />
              <input
                type="text"
                value={formData.rim_act_number || ''}
                onChange={(e) => onChange({ rim_act_number: e.target.value })}
                className="facility-form-edit-input"
                placeholder="Введите номер акта"
              />
            </div>
          </div>

          <div className="facility-form-edit-field">
            <label className="facility-form-edit-label">
              Номер акта ввода
            </label>
            <div className="facility-form-edit-input-container">
              <FileText className="facility-form-edit-icon" />
              <input
                type="text"
                value={formData.commissioning_act_number || ''}
                onChange={(e) => onChange({ commissioning_act_number: e.target.value })}
                className="facility-form-edit-input"
                placeholder="Введите номер акта"
              />
            </div>
          </div>

          <div className="facility-form-edit-field">
            <label className="facility-form-edit-label">
              Номер разрешения на открытие
            </label>
            <div className="relative">
              <FileText className="facility-form-edit-icon" />
              <input
                type="text"
                value={formData.opening_permission_number || ''}
                onChange={(e) => onChange({ opening_permission_number: e.target.value })}
                className="facility-form-edit-input"
                placeholder="Введите номер разрешения"
              />
            </div>
          </div>
        </div>
      </div>

  );
}
