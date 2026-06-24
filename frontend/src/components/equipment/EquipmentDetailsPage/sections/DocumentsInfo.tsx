// DocumentsInfo.tsx
import React from 'react';
import { FileText, ClipboardList, FileCheck } from 'lucide-react';
import { Equipment } from '../../../../types';
import { Section } from './Section';
import { EquipmentInfoItem } from './EquipmentInfoItem';

export function DocumentsInfo({ equipment }: { equipment: Equipment }) {
  const hasData = equipment.first_invoice || equipment.material_invoice || (equipment.is_free_use && equipment.free_use_act_number);
  if (!hasData) return null;

  return (
    <Section title="Документы">
      {equipment.first_invoice && (
        <EquipmentInfoItem icon={FileText} label="Первичный документ" value={equipment.first_invoice} />
      )}
      {equipment.material_invoice && (
        <EquipmentInfoItem icon={ClipboardList} label="Накладная на МОЛ" value={equipment.material_invoice} />
      )}
      {equipment.is_free_use && equipment.free_use_act_number && (
        <EquipmentInfoItem icon={FileCheck} label="Акт безвозмездного пользования" value={equipment.free_use_act_number} />
      )}
    </Section>
  );
}