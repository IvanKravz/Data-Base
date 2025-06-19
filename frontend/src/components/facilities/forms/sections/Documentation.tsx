import React from 'react';
import { FileText } from 'lucide-react';
import { Facility } from '../../../../types';
import '../EditFacilityForm.css';

interface DocumentationProps {
  formData: Partial<Facility>;
  onChange: (data: Partial<Facility>) => void;
}

export function Documentation({ formData, onChange }: DocumentationProps) {
  return (
    <div className="facility-card-edit">
      <div className="facility-card-header-edit">
        <FileText size={20} />
        <h3 className="facility-card-title-edit">Документация</h3>
      </div>
      <div className="facility-card-content-edit">
          <div className="facility-form-field-edit">
            <label className="facility-form-label-edit">
              Номер акта приемки помещения
            </label>
            <div className="facility-form-input-container-edit">
              <FileText className="facility-form-icon-edit" />
              <input
                type="text"
                value={formData.acceptance_act_number || ''}
                onChange={(e) => onChange({ acceptance_act_number: e.target.value })}
                className="facility-form-input-edit"
                placeholder="Введите номер акта"
              />
            </div>
          </div>

          <div className="facility-form-field-edit">
            <label className="facility-form-label-edit">
              Номер акта РИМ
            </label>
            <div className="facility-form-input-container-edit">
              <FileText className="facility-form-icon-edit" />
              <input
                type="text"
                value={formData.rim_act_number || ''}
                onChange={(e) => onChange({ rim_act_number: e.target.value })}
                className="facility-form-input-edit"
                placeholder="Введите номер акта"
              />
            </div>
          </div>

          <div className="facility-form-field-edit">
            <label className="facility-form-label-edit">
              Номер акта ввода
            </label>
            <div className="facility-form-input-container-edit">
              <FileText className="facility-form-icon-edit" />
              <input
                type="text"
                value={formData.commissioning_act_number || ''}
                onChange={(e) => onChange({ commissioning_act_number: e.target.value })}
                className="facility-form-input-edit"
                placeholder="Введите номер акта"
              />
            </div>
          </div>

          <div className="facility-form-field-edit">
            <label className="facility-form-label-edit">
              Номер разрешения на открытие
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={formData.opening_permission_number || ''}
                onChange={(e) => onChange({ opening_permission_number: e.target.value })}
                className="facility-form-input-edit"
                placeholder="Введите номер разрешения"
              />
            </div>
          </div>
        </div>
      </div>

  );
}