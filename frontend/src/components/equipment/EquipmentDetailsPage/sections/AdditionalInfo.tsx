import React from 'react';
import { Equipment } from '../../../../types';
import { Clock, Shield, Target, Gift, Info } from 'lucide-react';
import '../style.css';

interface AdditionalInfoProps {
  equipment: Equipment;
}

export function AdditionalInfo({ equipment }: AdditionalInfoProps) {
  const getSecretLevelDisplay = (level: string) => {
    switch (level) {
      case 'OV': return 'ОВ';
      case 'SS': return 'СС';
      case 'SECRET': return 'Секретно';
      case 'DSP': return 'ДСП';
      default: return level;
    }
  };

  // Проверяем, есть ли какие-либо дополнительные данные для отображения
  const hasAdditionalInfo = equipment.service_life || 
                           equipment.secret_level || 
                           equipment.interest_organ || 
                           equipment.is_free_use;

  if (!hasAdditionalInfo) {
    return null;
  }

  return (
    <div className="equipment-card">
      <h2 className="equipment-card__title">Дополнительная информация</h2>
      <div className="equipment-card-content">
        <div className="equipment-info-grid">
          

          {equipment.secret_level && (
            <div className="equipment-info-item">
              <Shield className="equipment-info-item__icon text-red-500" size={20} />
              <div>
                <p className="equipment-info-item__label">Степень секретности</p>
                <p className="equipment-info-item__value">
                  {getSecretLevelDisplay(equipment.secret_level)}
                </p>
              </div>
            </div>
          )}

          {equipment.interest_organ && (
            <div className="equipment-info-item">
              <Target className="equipment-info-item__icon text-indigo-500" size={20} />
              <div>
                <p className="equipment-info-item__label">В чьих интересах</p>
                <p className="equipment-info-item__value">{equipment.interest_organ.name}</p>
              </div>
            </div>
          )}

          {equipment.is_free_use && (
            <div className="equipment-info-item">
              <Gift className="equipment-info-item__icon text-green-500" size={20} />
              <div>
                <p className="equipment-info-item__label">Безвозмездное пользование</p>
                <p className="equipment-info-item__value">Да</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}