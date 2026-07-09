// FacilityMainInfo.tsx
import React, { useMemo } from 'react';
import { Building2, Hash, Network } from 'lucide-react';
import { Facility } from '../../../../types';
import { Section } from './Section';
import { FacilityInfoItem } from './FacilityInfoItem';
import { useAppPermissions } from '../../../../api/utils/AppPermissionsContext';

interface FacilityMainInfoProps {
  facility: Facility;
  searchTerm?: string;
}

export function FacilityMainInfo({ facility, searchTerm = '' }: FacilityMainInfoProps) {
  const { canAccessCommunicationPosts } = useAppPermissions();
  const canViewPosts = canAccessCommunicationPosts();

  const getTypeDisplay = () => {
    if (facility.type?.name) return facility.type.name;
    if (facility.type === 'station') return 'Станция';
    if (facility.type === 'shd') return 'ШД';
    return 'Не указан';
  };

  const items = useMemo(() => {
    const list: { label: string; value: string; icon: any }[] = [];

    // Название всегда показываем
    list.push({ label: 'Название', value: facility.name, icon: Building2 });

    // Тип – только если есть значение
    const typeDisplay = getTypeDisplay();
    if (typeDisplay && typeDisplay !== 'Не указан') {
      list.push({ label: 'Тип', value: typeDisplay, icon: Building2 });
    }

    // Класс – только если есть значение
    if (facility.facility_class && facility.facility_class.trim() !== '') {
      list.push({ label: 'Класс', value: facility.facility_class, icon: Hash });
    }

    // Посты связи – только если есть права и есть посты
    if (canViewPosts && facility.communication_posts?.length > 0) {
      list.push({
        label: 'Посты связи',
        value: facility.communication_posts.map(p => p.name).join(', '),
        icon: Network,
      });
    }

    return list;
  }, [facility, canViewPosts]);

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
    <Section title="Основная информация">
      {filteredItems.map((item, idx) => (
        <FacilityInfoItem key={idx} icon={item.icon} label={item.label} value={item.value} />
      ))}
    </Section>
  );
}