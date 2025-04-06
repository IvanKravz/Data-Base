import React from 'react';
import { Equipment } from '../../../../types';
import { Package, Box, HardDrive, CircleEllipsis } from 'lucide-react';
import '../style.css'

interface BasicInfoProps {
  equipment: Equipment;
}

export function BasicInfo({ equipment }: BasicInfoProps) {
  const getCategoryLabel = (value: string) => {
    const categories = [
      { value: 'tko', label: 'ТКО' },
      { value: 'radio', label: 'Радио' },
      { value: 'computer', label: 'СВТ' },
      { value: 'battery', label: 'АКБ' },
      { value: 'antenna', label: 'Антенны, мачты' },
      { value: 'power', label: 'Источники питания' },
      { value: 'materials', label: 'Материалы' }
    ];
    return categories.find(c => c.value === value)?.label || value;
  };

  const getStatusLabel = (value: string) => {
    const statuses = [
      { value: 'in-operation', label: 'Эксплуатируется' },
      { value: 'in-storage', label: 'На складе' },
      { value: 'defective', label: 'Неисправно' },
      { value: 'for-disposal', label: 'На списание' },
      { value: 'disposed', label: 'Списано' }
    ];
    return statuses.find(s => s.value === value)?.label || value;
  };

  return (
    <div className="equipment-card">
      <h2 className="equipment-card__title">Основная информация</h2>
      <div className="equipment-card-content">
        <div className="equipment-info-grid">
          <div className="equipment-info-item">
            <Package className="equipment-info-item__icon text-blue-500" size={20} />
            <div className="equipment-info-item__content">
              <p className="equipment-info-item__label">Название</p>
              <p className="equipment-info-item__value">{equipment.name}</p>
            </div>
          </div>

          {!equipment.is_closed && (
            <div className="equipment-info-item">
              <Box className="equipment-info-item__icon text-green-500" size={20} />
              <div>
                <p className="equipment-info-item__label">Категория</p>
                <p className="equipment-info-item__value">
                  {getCategoryLabel(equipment.open_category || '')}
                </p>
              </div>
            </div>
          )}

          <div className="equipment-info-item">
            <HardDrive className="equipment-info-item__icon text-brown-500" size={20} />
            <div>
              <p className="equipment-info-item__label">Тип техники</p>
              <p className="equipment-info-item__value">{equipment.type}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}