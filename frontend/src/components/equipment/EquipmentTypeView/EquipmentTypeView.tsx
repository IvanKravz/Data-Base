import React, { useState } from 'react';
import { ArrowLeft, Plus, Database } from 'lucide-react';
import { Equipment, EquipmentCategory } from '../types';
import { EquipmentList } from '../EquipmentList/EquipmentList';
import { CreateModal } from '../../modals/CreateModal';
import { CreateEquipmentForm } from '../../forms/equipment/CreateEquipmentForm';
// import { EquipmentList } from './EquipmentList';
// import { CreateModal } from './modals/CreateModal';
// import { CreateEquipmentForm } from './forms/CreateEquipmentForm';

interface EquipmentTypeViewProps {
  category: EquipmentCategory;
  equipment: Equipment[];
  onBack: () => void;
  onUpdateEquipment: (equipment: Equipment[]) => void;
}

const EQUIPMENT_CATEGORIES = {
  tko: 'ТКО',
  closed: 'Закрытая',
  radio: 'Радио',
  computer: 'СВТ',
  battery: 'АКБ',
  antenna: 'Антенны, мачты',
  power: 'Источники питания',
  materials: 'Материалы'
} as const;

export function EquipmentTypeView({ 
  category, 
  equipment,
  onBack,
  onUpdateEquipment
}: EquipmentTypeViewProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredEquipment = equipment.filter(item => item.category === category);

  const handleUpdateEquipment = (updatedEquipment: Equipment) => {
    onUpdateEquipment(equipment.map(item => 
      item.id === updatedEquipment.id ? updatedEquipment : item
    ));
  };

  const handleDeleteEquipment = (id: string) => {
    onUpdateEquipment(equipment.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Database className="h-6 w-6 text-blue-500" />
              {EQUIPMENT_CATEGORIES[category]}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Всего единиц техники: {filteredEquipment.length}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          <span>Добавить оборудование</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Список оборудования</h3>
        </div>
        <div className="p-4">
          <EquipmentList
            equipment={filteredEquipment}
            onUpdateEquipment={handleUpdateEquipment}
            onDeleteEquipment={handleDeleteEquipment}
            viewType="table"
          />
        </div>
      </div>

      {showCreateModal && (
        <CreateModal
          title="Добавить оборудование"
          onClose={() => setShowCreateModal(false)}
        >
          <CreateEquipmentForm
            category={category}
            equipment={equipment}
            onSubmit={(newEquipment) => {
              onUpdateEquipment([...equipment, { ...newEquipment, id: Date.now().toString() }]);
              setShowCreateModal(false);
            }}
            onCancel={() => setShowCreateModal(false)}
          />
        </CreateModal>
      )}
    </div>
  );
}