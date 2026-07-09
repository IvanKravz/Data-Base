// DocumentationCard.tsx
import React, { useMemo } from 'react';
import { FileText } from 'lucide-react';
import { Facility } from '../../../../types';
import { Section } from './Section';
import { FacilityInfoItem } from './FacilityInfoItem';

interface DocumentationCardProps {
  facility: Facility;
  searchTerm?: string;
}

export function DocumentationCard({ facility, searchTerm = '' }: DocumentationCardProps) {
  const items = useMemo(() => {
    const list: { label: string; value: string; icon: any }[] = [
      { label: 'Акт приемки помещения', value: facility.acceptance_act_number || '—', icon: FileText },
      { label: 'Акт РИМ', value: facility.rim_act_number || '—', icon: FileText },
      { label: 'Акт ввода', value: facility.commissioning_act_number || '—', icon: FileText },
      { label: 'Разрешение на открытие', value: facility.opening_permission_number || '—', icon: FileText },
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
    <Section title="Документация">
      {filteredItems.map((item, idx) => (
        <FacilityInfoItem key={idx} icon={item.icon} label={item.label} value={item.value} />
      ))}
    </Section>
  );
}