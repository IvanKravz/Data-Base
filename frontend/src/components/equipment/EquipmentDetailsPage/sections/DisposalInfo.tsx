// DisposalInfo.tsx
import React from 'react';
import { FileText, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Equipment } from '../../../../types';
import { Section } from './Section';
import { EquipmentInfoItem } from './EquipmentInfoItem';

export function DisposalInfo({ equipment }: { equipment: Equipment }) {
  if (!equipment.disposal_act_number && !equipment.disposal_cert_number) {
    return null;
  }

  return (
    <Section title="Информация о списании">
      <EquipmentInfoItem icon={FileText} label="№ акта списания" value={equipment.disposal_act_number || '—'} />
      {equipment.disposal_act_date && (
        <EquipmentInfoItem icon={Calendar} label="Дата акта" value={format(new Date(equipment.disposal_act_date), 'dd.MM.yyyy')} />
      )}
      <EquipmentInfoItem icon={FileText} label="№ справки о ликвидации" value={equipment.disposal_cert_number || '—'} />
      {equipment.disposal_cert_date && (
        <EquipmentInfoItem icon={Calendar} label="Дата справки" value={format(new Date(equipment.disposal_cert_date), 'dd.MM.yyyy')} />
      )}
      {equipment.disposal_comments && (
        <div>
          <span className="equipment-info-item__label">Комментарии к списанию</span>
          <p className="equipment-info-item__value equipment-info-item__value--multiline">
            {equipment.disposal_comments}
          </p>
        </div>
      )}
    </Section>
  );
}