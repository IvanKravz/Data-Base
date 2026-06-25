// sections/AssignmentInfo.tsx
import React, { useMemo } from 'react';
import { Building2, User, MapPin } from 'lucide-react';
import { Equipment } from '../../../../types';
import { Section } from './Section';
import { EquipmentInfoItem } from './EquipmentInfoItem';

interface AssignmentInfoProps {
  equipment: Equipment;
  searchTerm?: string;
}

export function AssignmentInfo({ equipment, searchTerm = '' }: AssignmentInfoProps) {
  const divisionValue = equipment.division?.name
    ? equipment.subdivision?.name
      ? `${equipment.division.name} - ${equipment.subdivision.name}`
      : equipment.division.name
    : 'Не указано';

  const items = useMemo(() => {
    const list: { label: string; value: string }[] = [
      { label: 'Подразделение', value: divisionValue },
    ];
    if (equipment.assigned_to) {
      list.push({ label: 'Закреплено за', value: equipment.assigned_to.full_name });
    }
    if (equipment.facility?.id) {
      list.push({ label: 'Объект', value: equipment.facility.name });
    }
    return list;
  }, [equipment, divisionValue]);

  // Фильтрация по поиску
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
    <Section title="Принадлежность">
      {filteredItems.map((item, idx) => {
        let Icon = Building2;
        if (item.label === 'Закреплено за') Icon = User;
        if (item.label === 'Объект') Icon = MapPin;
        return <EquipmentInfoItem key={idx} icon={Icon} label={item.label} value={item.value} />;
      })}
    </Section>
  );
}