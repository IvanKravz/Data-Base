// IdentificationInfo.tsx
import React from 'react';
import { Hash, NotebookTabs } from 'lucide-react';
import { Equipment } from '../../../../types';
import { Section } from './Section';
import { EquipmentInfoItem } from './EquipmentInfoItem';

export function IdentificationInfo({ equipment }: { equipment: Equipment }) {
  return (
    <Section title="Идентификация">
      <EquipmentInfoItem icon={Hash} label="Серийный номер" value={equipment.serial_number || '—'} />
      <EquipmentInfoItem icon={NotebookTabs} label="Инвентарный номер" value={equipment.inventory_number || '—'} />
    </Section>
  );
}