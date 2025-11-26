import React from 'react';
import { Equipment, EquipmentFieldPermissions } from '../../../../../types';
import { Package } from 'lucide-react';
import '../style.css';

interface BasicInformationProps {
  formData: Partial<Equipment>;
  onChange: (data: Partial<Equipment>) => void;
  isClosedEquipment?: boolean;
  isDisposed?: boolean;
  equipmentCategories: { value: string; name: string; is_closed: boolean }[];
  permissions: EquipmentFieldPermissions;
}

export function BasicInformation({
  formData,
  onChange,
  isDisposed = false,
  equipmentCategories = [],
  permissions
}: BasicInformationProps) {

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    const selectedCategory = equipmentCategories.find(
      cat => cat.value === selectedValue
    );

    if (selectedCategory) {
      onChange({
        category: selectedCategory,
        is_closed: selectedCategory.is_closed
      });
    } else {
      onChange({
        category: null,
        is_closed: false
      });
    }
  };

  const getCurrentCategoryValue = () => {
    return formData.category?.value || '';
  };

  return (
    <div className="equipment-card-edit">
      <div className="equipment-card-header">
        <Package size={20} />
        <h3 className="equipment-card-title">Основная информация</h3>
      </div>
      <div className="equipment-card-content-edit">
        <div className="equipment-form-group">
          <label className="equipment-form-label">Название</label>
          <div className="form-input-container">
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={(e) => onChange({ name: e.target.value })}
              className="form-input-edit"
              placeholder="Введите название техники"
              disabled={isDisposed || !permissions.canEditName}
            />
          </div>
        </div>

        <div className="equipment-form-group">
          <label className="equipment-form-label">Категория</label>
          <div className="form-input-container">
            <select
              value={getCurrentCategoryValue()}
              onChange={handleCategoryChange}
              className="form-input-edit"
              disabled={isDisposed || !permissions.canEditCategory}
            >
              <option value="">Выберите категорию</option>
              {equipmentCategories.map((category) => (
                <option
                  key={`cat_${category.value}`}
                  value={category.value}
                >
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="equipment-form-group">
          <label className="equipment-form-label">Модель</label>
          <input
            type="text"
            value={formData.type || ''}
            onChange={(e) => onChange({ type: e.target.value })}
            className="form-input-edit"
            placeholder="Введите тип техники"
            disabled={isDisposed || !permissions.canEditModel}
          />
        </div>

        <div className="equipment-form-group">
          <label className="equipment-form-label">Статус</label>
          <select
            value={formData.status || 'in-operation'}
            onChange={(e) => onChange({ status: e.target.value as Equipment['status'] })}
            className="form-input-edit"
            disabled={isDisposed || !permissions.canEditStatus}
          >
            <option value="in-operation">Эксплуатируется</option>
            <option value="in-storage">На складе</option>
            <option value="defective">Неисправно</option>
            <option value="for-disposal">На списание</option>
            {isDisposed && <option value="disposed">Списано</option>}
          </select>
        </div>

        <div className="equipment-form-group">
          <label className="equipment-form-label">Версия ПО</label>
          <input
            type="text"
            value={formData.ver_software || ''}
            onChange={(e) => onChange({ ver_software: e.target.value })}
            className="form-input-edit"
            placeholder="Введите версию ПО"
            disabled={isDisposed || !permissions.canEditSoftwareVersion}
          />
        </div>
      </div>
    </div>
  );
}