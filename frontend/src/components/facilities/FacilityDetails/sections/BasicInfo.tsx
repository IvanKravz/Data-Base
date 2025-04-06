import React from 'react';
import { Building2, MapPin, FileText, Ruler, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { Facility } from '../../../../types';
import { InfoCard } from './InfoCard';
import { InfoItem } from './InfoItem';

interface BasicInfoProps {
  facility: Facility;
}

export function BasicInfo({ facility }: BasicInfoProps) {
  const isOpenFacility = facility.type === 'station';

  return (
    <div className="space-y-6">
      <InfoCard title="Основная информация">
        <div className="space-y-4">
          <InfoItem
            icon={Building2}
            iconColor="text-blue-500"
            label="Название"
            value={facility.name}
          />
          <InfoItem
            icon={MapPin}
            iconColor="text-green-500"
            label="Адрес"
            value={facility.address}
          />
          <InfoItem
            icon={Building2}
            iconColor="text-purple-500"
            label="Подразделение"
            value={`${facility.division}${facility.subdivision ? ` - ${facility.subdivision}` : ''}`}
          />
        </div>
      </InfoCard>

      {facility.comments && (
        <InfoCard title="Комментарии">
          <div className="flex items-start gap-3">
            <MessageSquare className="h-5 w-5 text-indigo-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-gray-900 whitespace-pre-wrap">{facility.comments}</p>
            </div>
          </div>
        </InfoCard>
      )}

      {!isOpenFacility && (
        <>
          <InfoCard title="Документация">
            <div className="space-y-4">
              <InfoItem
                icon={FileText}
                iconColor="text-indigo-500"
                label="Акт приемки помещения"
                value={facility.acceptanceActNumber || 'Не указан'}
              />
              <InfoItem
                icon={FileText}
                iconColor="text-indigo-500"
                label="Акт РИМ"
                value={facility.rimActNumber || 'Не указан'}
              />
              <InfoItem
                icon={FileText}
                iconColor="text-indigo-500"
                label="Акт ввода"
                value={facility.commissioningActNumber || 'Не указан'}
              />
              <InfoItem
                icon={FileText}
                iconColor="text-indigo-500"
                label="Разрешение на открытие"
                value={facility.openingPermissionNumber || 'Не указан'}
              />
            </div>
          </InfoCard>

          <InfoCard title="Информация о КЗ">
            <div className="space-y-4">
              <InfoItem
                icon={Ruler}
                iconColor="text-orange-500"
                label="Размер КЗ"
                value={facility.kzSize || 'Не указан'}
              />
              <InfoItem
                icon={facility.hasTransformerInKz ? CheckCircle : XCircle}
                iconColor={facility.hasTransformerInKz ? 'text-green-500' : 'text-red-500'}
                label="ТП в пределах КЗ"
                value={facility.hasTransformerInKz ? 'Да' : 'Нет'}
              />
              <InfoItem
                icon={facility.hasGroundingInKz ? CheckCircle : XCircle}
                iconColor={facility.hasGroundingInKz ? 'text-green-500' : 'text-red-500'}
                label="Контур заземления в пределах КЗ"
                value={facility.hasGroundingInKz ? 'Да' : 'Нет'}
              />
            </div>
          </InfoCard>
        </>
      )}
    </div>
  );
}