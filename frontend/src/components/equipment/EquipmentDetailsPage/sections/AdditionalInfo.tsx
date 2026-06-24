// AdditionalInfo.tsx
import React from 'react';
import { Shield, Target, Gift } from 'lucide-react';
import { Equipment } from '../../../../types';
import { Section } from './Section';
import { EquipmentInfoItem } from './EquipmentInfoItem';

export function AdditionalInfo({ equipment }: { equipment: Equipment }) {
  const getSecretLevelDisplay = (level: string) => {
    switch (level) {
      case 'OV': return 'ОВ';
      case 'SS': return 'СС';
      case 'SECRET': return 'Секретно';
      case 'DSP': return 'ДСП';
      default: return level;
    }
  };

  const hasData = equipment.secret_level || equipment.interest_organ || equipment.is_free_use;
  if (!hasData) return null;

  return (
    <Section title="Дополнительная информация">
      {equipment.secret_level && (
        <EquipmentInfoItem icon={Shield} label="Степень секретности" value={getSecretLevelDisplay(equipment.secret_level)} />
      )}
      {equipment.interest_organ && (
        <EquipmentInfoItem icon={Target} label="В чьих интересах" value={equipment.interest_organ.name} />
      )}
      {equipment.is_free_use && (
        <EquipmentInfoItem icon={Gift} label="Безвозмездное пользование" value="Да" />
      )}
    </Section>
  );
}