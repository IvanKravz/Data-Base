import React, { useMemo } from 'react';
import { User, Building2, Calendar, Tag, ShieldCheck, KeyRound } from 'lucide-react';
import { Employee } from '../../../../types';
import { InfoCard } from './InfoCard';
import { InfoItem } from './InfoItem';
import { formatDisplayDate } from '../../../../api/utils/dateFormatters';

interface BasicInfoProps {
  person: Employee;
  searchTerm?: string;
}

export function BasicInfo({ person, searchTerm = '' }: BasicInfoProps) {
  const fields = useMemo(() => {
    const items: { label: string; value: string | null; icon: React.ElementType; key: string }[] = [
      { label: 'Должность', value: person.position, icon: User, key: 'position' },
      { label: 'Звание', value: person.rank, icon: Tag, key: 'rank' },
      { label: 'Подразделение', value: person.division?.name || null, icon: Building2, key: 'division' },
      { label: 'Отделение', value: person.subdivision?.name || null, icon: Building2, key: 'subdivision' },
      { label: 'Дата рождения', value: person.birth_date ? formatDisplayDate(person.birth_date) : null, icon: Calendar, key: 'birth_date' },
    ];
    return items;
  }, [person]);

  const visibleFields = useMemo(() => fields.filter(f => f.value != null), [fields]);

  const filteredFields = useMemo(() => {
    if (!searchTerm.trim()) return visibleFields;
    const lower = searchTerm.toLowerCase().trim();
    return visibleFields.filter(f =>
      f.label.toLowerCase().includes(lower) ||
      (f.value && f.value.toLowerCase().includes(lower))
    );
  }, [visibleFields, searchTerm]);

  const showMaterial = person.is_material_responsible;
  const showSha = person.is_sha_worker && person.sha_details;
  const materialMatches = showMaterial && (
    !searchTerm.trim() ||
    'материально ответственный'.includes(searchTerm.toLowerCase().trim()) ||
    'мол'.includes(searchTerm.toLowerCase().trim())
  );
  const shaMatches = showSha && (
    !searchTerm.trim() ||
    'шаработник'.includes(searchTerm.toLowerCase().trim()) ||
    (person.sha_details?.access_level === '1' ? '1 класс' : '2 класс').includes(searchTerm.toLowerCase().trim()) ||
    (person.sha_details?.start_date ? formatDisplayDate(person.sha_details.start_date) : '').includes(searchTerm.toLowerCase().trim())
  );

  if (filteredFields.length === 0 && !materialMatches && !shaMatches) {
    return <div className="no-comments-text">Ничего не найдено</div>;
  }

  return (
    <InfoCard title="Основная информация">
      {filteredFields.map((field) => (
        <InfoItem key={field.key} icon={field.icon} label={field.label} value={field.value || '—'} />
      ))}
      
      {materialMatches && (
        <div className="info-item-personel">
          <ShieldCheck className="info-item-icon info-item-icon-success" />
          <div>
            <p className="info-item-label info-item-label-success">МАТЕРИАЛЬНО ОТВЕТСТВЕННЫЙ</p>
            <p className="info-item-value info-item-value-small">Сотрудник является МОЛ</p>
          </div>
        </div>
      )}

      {shaMatches && (
        <div className="info-item-personel">
          <KeyRound className="info-item-icon info-item-icon-primary" />
          <div>
            <p className="info-item-label info-item-label-primary">ШАРАБОТНИК</p>
            <p className="info-item-value info-item-value-small">
              {person.sha_details?.access_level === '1' ? '1 класс' : '2 класс'}
              {person.sha_details?.start_date && `, с ${formatDisplayDate(person.sha_details.start_date)}`}
            </p>
          </div>
        </div>
      )}
    </InfoCard>
  );
}