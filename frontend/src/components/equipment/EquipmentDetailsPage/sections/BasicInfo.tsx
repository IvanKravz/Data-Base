import React from 'react';
import { Equipment } from '../../../../types';
import { Package, Box, HardDrive, CircleEllipsis, Code, Clock, Shield, Target, Gift } from 'lucide-react';
import '../style.css'

interface BasicInfoProps {
  equipment: Equipment;
}

export function BasicInfo({ equipment }: BasicInfoProps) {
  const getSecretLevelDisplay = (level: string) => {
    switch (level) {
      case 'OV': return 'ОВ';
      case 'SS': return 'СС';
      case 'SECRET': return 'Секретно';
      case 'DSP': return 'ДСП';
      default: return level;
    }
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

          <div className="equipment-info-item">
            <Box className="equipment-info-item__icon text-green-500" size={20} />
            <div>
              <p className="equipment-info-item__label">Категория</p>
              <p className="equipment-info-item__value">
                {equipment.category_display || 'Не указана'}
              </p>
            </div>
          </div>

          <div className="equipment-info-item">
            <HardDrive className="equipment-info-item__icon text-brown-500" size={20} />
            <div>
              <p className="equipment-info-item__label">Модель техники</p>
              <p className="equipment-info-item__value">{equipment.type}</p>
            </div>
          </div>

          {equipment.ver_software && (
            <div className="equipment-info-item">
              <Code className="equipment-info-item__icon text-indigo-500" size={20} />
              <div>
                <p className="equipment-info-item__label">Версия ПО</p>
                <p className="equipment-info-item__value">{equipment.ver_software}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}