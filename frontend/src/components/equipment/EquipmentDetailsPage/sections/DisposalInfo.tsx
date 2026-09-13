// sections/DisposalInfo.tsx
import React, { useMemo } from 'react';
import { FileText, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Equipment } from '../../../../types';
import { Section } from './Section';
import { EquipmentInfoItem } from './EquipmentInfoItem';

interface DisposalInfoProps {
  equipment: Equipment;
  searchTerm?: string;
}

const safeFormatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return format(date, 'dd.MM.yyyy');
  } catch {
    return '—';
  }
};

export function DisposalInfo({ equipment, searchTerm = '' }: DisposalInfoProps) {
  const disposal = equipment.disposal_info;

  if (!disposal) return null;
  if (!disposal.actNumber && !disposal.disposalCertNumber && !disposal.actDate && !disposal.disposalCertDate) {
    return null;
  }

  const items = useMemo(() => {
    const list: { label: string; value: string }[] = [];

    if (disposal.actNumber) {
      list.push({ label: '№ акта списания', value: disposal.actNumber });
    }
    if (disposal.actDate) {
      list.push({ label: 'Дата акта', value: safeFormatDate(disposal.actDate) });
    }
    if (disposal.disposalCertNumber) {
      list.push({ label: '№ справки о ликвидации', value: disposal.disposalCertNumber });
    }
    if (disposal.disposalCertDate) {
      list.push({ label: 'Дата справки', value: safeFormatDate(disposal.disposalCertDate) });
    }
    return list;
  }, [disposal]);

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const lower = searchTerm.toLowerCase().trim();
    return items.filter(item =>
      item.label.toLowerCase().includes(lower) ||
      item.value.toLowerCase().includes(lower)
    );
  }, [items, searchTerm]);

  if (filteredItems.length === 0 && !disposal.comments) return null;

  return (
    <Section title="Информация о списании">
      {filteredItems.map((item, idx) => {
        const Icon = item.label.includes('Дата') ? Calendar : FileText;
        return <EquipmentInfoItem key={idx} icon={Icon} label={item.label} value={item.value} />;
      })}
      {disposal.comments && (
        <div>
          <span className="equipment-info-item__label">Комментарии к списанию</span>
          <p className="equipment-info-item__value equipment-info-item__value--multiline">
            {disposal.comments}
          </p>
        </div>
      )}
    </Section>
  );
}