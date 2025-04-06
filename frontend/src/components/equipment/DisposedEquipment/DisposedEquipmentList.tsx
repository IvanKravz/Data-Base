import React, { useState } from 'react';
import { Equipment } from '../../../types';
import { format } from 'date-fns';
import { FileText, Calendar, Trash2, ChevronRight } from 'lucide-react';
import { DeleteConfirmationModal } from '../../modals/DeleteConfirmationModal';

interface DisposedEquipmentListProps {
  equipment: Equipment[];
  onDelete: (id: string) => void;
  onViewDetails: (equipment: Equipment) => void;
}

export function DisposedEquipmentList({ equipment, onDelete, onViewDetails }: DisposedEquipmentListProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  const handleDelete = (e: React.MouseEvent, equipment: Equipment) => {
    e.stopPropagation();
    setSelectedEquipment(equipment);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (selectedEquipment) {
      onDelete(selectedEquipment.id);
    }
    setShowDeleteModal(false);
    setSelectedEquipment(null);
  };

  if (equipment.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-500">Нет списанной техники</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {equipment.map((item) => (
        <div
          key={item.id}
          onClick={() => onViewDetails(item)}
          className="group bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-4 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                  {item.name}
                </h3>
                <ChevronRight className="h-5 w-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Акт списания №{item.disposalInfo?.actNumber}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4 text-green-500" />
                    <span className="text-sm">
                      {format(new Date(item.disposalInfo?.actDate || ''), 'dd.MM.yyyy')}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <FileText className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Справка №{item.disposalInfo?.disposalCertNumber}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">
                      {format(new Date(item.disposalInfo?.disposalCertDate || ''), 'dd.MM.yyyy')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Серийный номер</p>
                    <p className="font-medium text-gray-900">{item.serialNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Инвентарный номер</p>
                    <p className="font-medium text-gray-900">{item.inventoryNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Подразделение</p>
                    <p className="font-medium text-gray-900">
                      {item.division}
                      {item.subdivision && ` - ${item.subdivision}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Тип</p>
                    <p className="font-medium text-gray-900">{item.type}</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={(e) => handleDelete(e, item)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      ))}

      {showDeleteModal && (
        <DeleteConfirmationModal
          title="Удаление списанной техники"
          message="Вы уверены, что хотите удалить эту технику? Это действие нельзя отменить."
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setSelectedEquipment(null);
          }}
        />
      )}
    </div>
  );
}