import React from 'react';
import { X } from 'lucide-react';
import { Equipment } from '../../types';
import { format } from 'date-fns';

interface EquipmentDetailsModalProps {
  equipment: Equipment;
  onClose: () => void;
  showDisposalInfo?: boolean;
}

export function EquipmentDetailsModal({ equipment, onClose, showDisposalInfo }: EquipmentDetailsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">{equipment.name}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="font-medium text-gray-900 mb-4">Основная информация</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Тип</p>
                <p className="font-medium">{equipment.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Категория</p>
                <p className="font-medium">{equipment.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Серийный номер</p>
                <p className="font-medium">{equipment.serialNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Инвентарный номер</p>
                <p className="font-medium">{equipment.inventoryNumber}</p>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div>
            <h3 className="font-medium text-gray-900 mb-4">Даты</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Дата производства</p>
                <p className="font-medium">{format(new Date(equipment.manufacturingDate), 'dd.MM.yyyy')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Дата покупки</p>
                <p className="font-medium">{format(new Date(equipment.purchaseDate), 'dd.MM.yyyy')}</p>
              </div>
            </div>
          </div>

          {/* Assignment */}
          <div>
            <h3 className="font-medium text-gray-900 mb-4">Принадлежность</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Подразделение</p>
                <p className="font-medium">
                  {equipment.division}
                  {equipment.subdivision && ` - ${equipment.subdivision}`}
                </p>
              </div>
              {equipment.assignedTo && (
                <div>
                  <p className="text-sm text-gray-500">Закреплено за</p>
                  <p className="font-medium">{equipment.assignedTo}</p>
                </div>
              )}
            </div>
          </div>

          {/* Disposal Information */}
          {showDisposalInfo && equipment.disposalInfo && (
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Информация о списании</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">№ акта списания</p>
                  <p className="font-medium">{equipment.disposalInfo.actNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Дата акта</p>
                  <p className="font-medium">
                    {format(new Date(equipment.disposalInfo.actDate), 'dd.MM.yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">№ справки о ликвидации</p>
                  <p className="font-medium">{equipment.disposalInfo.disposalCertNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Дата справки</p>
                  <p className="font-medium">
                    {format(new Date(equipment.disposalInfo.disposalCertDate), 'dd.MM.yyyy')}
                  </p>
                </div>
              </div>
              {equipment.disposalInfo.comments && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Комментарии</p>
                  <p className="mt-1 text-gray-700">{equipment.disposalInfo.comments}</p>
                </div>
              )}
            </div>
          )}

          {/* Comments */}
          {equipment.comments && (
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Комментарии</h3>
              <p className="text-gray-700">{equipment.comments}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}