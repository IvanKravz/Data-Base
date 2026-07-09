// KzInfoCard.tsx
import React, { useMemo } from 'react';
import { Ruler, CheckCircle, XCircle } from 'lucide-react';
import { Facility } from '../../../../types';
import { Section } from './Section';
import { FacilityInfoItem } from './FacilityInfoItem';

interface KzInfoCardProps {
  facility: Facility;
  searchTerm?: string;
}

export function KzInfoCard({ facility, searchTerm = '' }: KzInfoCardProps) {
  const items = useMemo(() => {
    const list: { label: string; value: string; icon: any }[] = [
      { label: 'Размер КЗ', value: facility.kz_size || '—', icon: Ruler },
      { label: 'ТП в пределах КЗ', value: facility.has_transformer_in_kz ? 'Да' : 'Нет', icon: facility.has_transformer_in_kz ? CheckCircle : XCircle },
      { label: 'Контур заземления в пределах КЗ', value: facility.has_grounding_in_kz ? 'Да' : 'Нет', icon: facility.has_grounding_in_kz ? CheckCircle : XCircle },
    ];
    return list;
  }, [facility]);

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
    <Section title="Информация о КЗ">
      {filteredItems.map((item, idx) => (
        <FacilityInfoItem key={idx} icon={item.icon} label={item.label} value={item.value} />
      ))}
    </Section>
  );
}