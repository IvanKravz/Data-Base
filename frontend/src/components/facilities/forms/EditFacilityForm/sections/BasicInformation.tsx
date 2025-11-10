import React, { useRef, useEffect } from 'react';
import { Building2, MapPin } from 'lucide-react';
import { Facility } from '../../../../../types';
import '../EditFacilityForm.css';

interface BasicInformationProps {
  formData: Partial<Facility>;
  onChange: (data: Partial<Facility>) => void;
  isClosedFacility?: boolean;
}

export function BasicInformation({ formData, onChange }: BasicInformationProps) {
  const nameTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Автоматическое изменение высоты textarea при изменении содержимого
  useEffect(() => {
    const textarea = nameTextareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [formData.name]);

  const handleNameChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ name: e.target.value });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Предотвращаем перенос строки по Enter
    }
  };

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
          <div className="facility-form-input-container-edit facility-textarea-container">
            <Building2 className="facility-form-icon-edit" />
            <textarea
              ref={nameTextareaRef}
              required
              value={formData.name || ''}
              onChange={handleNameChange}
              onKeyDown={handleKeyDown}
              className="facility-form-textarea facility-form-input-edit"
              placeholder="Введите название объекта"
              rows={1}
              style={{
                resize: 'none',
                overflow: 'hidden',
                minHeight: '40px',
                lineHeight: '1.5',
                paddingTop: '8px',
                paddingBottom: '8px'
              }}
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