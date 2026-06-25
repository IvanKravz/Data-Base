// sections/DocumentsInfo.tsx
import React, { useMemo } from 'react';
import { FileText, ClipboardList, FileCheck } from 'lucide-react';
import { Equipment } from '../../../../types';
import { Section } from './Section';
import { EquipmentInfoItem } from './EquipmentInfoItem';

interface DocumentsInfoProps {
  equipment: Equipment;
  searchTerm?: string;
}

export function DocumentsInfo({ equipment, searchTerm = '' }: DocumentsInfoProps) {
  const items = useMemo(() => {
    const list: { label: string; value: string; icon: any }[] = [];
    if (equipment.first_invoice) {
      list.push({ label: 'Первичный документ', value: equipment.first_invoice, icon: FileText });
    }
    if (equipment.material_invoice) {
      list.push({ label: 'Накладная на МОЛ', value: equipment.material_invoice, icon: ClipboardList });
    }
    if (equipment.is_free_use && equipment.free_use_act_number) {
      list.push({ label: 'Акт безвозмездного пользования', value: equipment.free_use_act_number, icon: FileCheck });
    }
    return list;
  }, [equipment]);

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const lower = searchTerm.toLowerCase().trim();
    return items.filter(item =>
      item.label.toLowerCase().includes(lower) ||
      item.value.toLowerCase().includes(lower)
    );
  }, [items, searchTerm]);

  if (filteredItems.length === 0) return null;

  return (
    <Section title="Документы">
      {filteredItems.map((item, idx) => (
        <EquipmentInfoItem key={idx} icon={item.icon} label={item.label} value={item.value} />
      ))}
    </Section>
  );
}