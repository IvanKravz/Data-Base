import React from 'react';
import { Building2, MapPin } from 'lucide-react';
import { Facility } from '../../../../types';
import '../EditFacilityForm.css';

interface BasicInformationProps {
  formData: Partial<Facility>;
  onChange: (data: Partial<Facility>) => void;
  isClosedFacility?: boolean;
}

export function BasicInformation({ formData, onChange }: BasicInformationProps) {
  return (
    <div className="facility-card-edit">
      <div className="facility-card-header-edit">
        <Building2 size={20} />
        <h3 className="facility-card-title-edit">Основная информация</h3>
      </div>
      <div className="facility-card-content-edit">
        <div className="facility-form-field-edit">
          <label className="facility-form-label-edit">
            Название объекта
          </label>
          <div className="facility-form-input-container-edit">
            <Building2 className="facility-form-icon-edit" />
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={(e) => onChange({ name: e.target.value })}
              className="facility-form-input-edit"
              placeholder="Введите название объекта"
            />
          </div>
        </div>

        <div className="facility-form-field-edit">
          <label className="facility-form-label-edit">
            Адрес
          </label>
          
          <div className="facility-form-input-container-edit">
            <MapPin className="facility-form-icon-edit" />
            <input
              type="text"
              required
              value={formData.city || ''}
              onChange={(e) => onChange({ city: e.target.value })}
              className="facility-form-input-edit"
              placeholder="Город"
            />
          </div>
          
          <div className="facility-form-input-container-edit" style={{ marginTop: '8px' }}>
            <MapPin className="facility-form-icon-edit" />
            <input
              type="text"
              value={formData.street || ''}
              onChange={(e) => onChange({ street: e.target.value })}
              className="facility-form-input-edit"
              placeholder="Улица"
            />
          </div>
          
          <div className="facility-form-input-container-edit" style={{ marginTop: '8px' }}>
            <MapPin className="facility-form-icon-edit" />
            <input
              type="text"
              value={formData.house_number || ''}
              onChange={(e) => onChange({ house_number: e.target.value })}
              className="facility-form-input-edit"
              placeholder="Номер дома"
            />
          </div>
        </div>
      </div>
    </div>
  );
}