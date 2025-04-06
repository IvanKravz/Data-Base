import React from 'react';
import { Package, Tag, MessageSquare } from 'lucide-react';
import { Equipment } from '../../../../types';
import { EQUIPMENT_CATEGORIES } from '../../constants';
import { InfoCard } from './InfoCard';
import { InfoItem } from './InfoItem';

interface BasicInfoProps {
  equipment: Equipment;
}

export function BasicInfo({ equipment }: BasicInfoProps) {
  return (
    <div className="space-y-6">
      <InfoCard title="Основная информация">
        <div className="space-y-4">
          <InfoItem
            icon={Package}
            iconColor="text-blue-500"
            label="Тип техники"
            value={equipment.type}
          />
          <InfoItem
            icon={Tag}
            iconColor="text-purple-500"
            label="Категория"
            value={EQUIPMENT_CATEGORIES[equipment.category]}
          />
        </div>
      </InfoCard>

      {equipment.comments && (
        <InfoCard title="Комментарии">
          <div className="flex items-start gap-3">
            <MessageSquare className="h-5 w-5 text-indigo-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-gray-900 whitespace-pre-wrap">{equipment.comments}</p>
            </div>
          </div>
        </InfoCard>
      )}
    </div>
  );
}