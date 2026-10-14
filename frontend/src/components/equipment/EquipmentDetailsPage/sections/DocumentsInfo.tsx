// sections/DocumentsInfo.tsx
import React, { useMemo } from 'react';
import { FileText, ClipboardList, FileCheck, ShieldCheck } from 'lucide-react';
import { Equipment } from '../../../../types';
import { Section } from './Section';
import { EquipmentInfoItem } from './EquipmentInfoItem';

interface DocumentsInfoProps {
  equipment: Equipment;
  searchTerm?: string;
}

/** Формат даты в дд.мм.гггг */
function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  try {
    // YYYY-MM-DD
    const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return `${iso[3]}.${iso[2]}.${iso[1]}`;
    // DD.MM.YYYY / DD-MM-YYYY
    const dmy = value.match(/^(\d{2})[.\-](\d{2})[.\-](\d{4})$/);
    if (dmy) return `${dmy[1]}.${dmy[2]}.${dmy[3]}`;
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      return `${dd}.${mm}.${d.getFullYear()}`;
    }
  } catch {
    // ignore
  }
  return value;
}

export function DocumentsInfo({ equipment, searchTerm = '' }: DocumentsInfoProps) {
  const isSzi = equipment.is_szi || equipment.category?.value === 'szi';

  const items = useMemo(() => {
    const list: { label: string; value: string; icon: any }[] = [];

    if (equipment.first_invoice) {
      list.push({
        label: 'Первичный документ',
        value: equipment.first_invoice,
        icon: FileText,
      });
    }
    if (equipment.material_invoice) {
      list.push({
        label: 'Накладная на МОЛ',
        value: equipment.material_invoice,
        icon: ClipboardList,
      });
    }
    if (equipment.is_free_use && equipment.free_use_act_number) {
      list.push({
        label: 'Акт безвозмездного пользования',
        value: equipment.free_use_act_number,
        icon: FileCheck,
      });
    }

    // === СЗИ ===
    if (isSzi) {
      if (equipment.szi_certificate_number) {
        list.push({
          label: 'Номер сертификата СЗИ',
          value: equipment.szi_certificate_number,
          icon: ShieldCheck,
        });
      }
      if (equipment.szi_certificate_date) {
        list.push({
          label: 'Дата сертификата СЗИ',
          value: formatDate(equipment.szi_certificate_date),
          icon: ShieldCheck,
        });
      }
    }

    return list;
  }, [equipment, isSzi]);

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const lower = searchTerm.toLowerCase().trim();
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(lower) ||
        item.value.toLowerCase().includes(lower),
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