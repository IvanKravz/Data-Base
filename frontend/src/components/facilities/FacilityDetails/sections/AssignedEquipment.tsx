import React, { useState } from 'react';
import { Database } from 'lucide-react';
import { Facility, Equipment } from '../../../../types';
import { EquipmentList } from '../../../equipment/EquipmentList';
import { EquipmentModal } from '../../../equipment/EquipmentModal';
import { sampleEquipment } from '../../../../data/sampleData';

interface AssignedEquipmentProps {
  facility: Facility;
}

export function AssignedEquipment({ facility }: AssignedEquipmentProps) {
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const facilityEquipment = sampleEquipment.filter(item => item.facilityId === facility.id);

  const handleUpdateEquipment = (updatedEquipment: Equipment) => {
    console.log('Updated equipment:', updatedEquipment);
    setSelectedEquipment(null);
  };

  const handleDeleteEquipment = (id: string) => {
    console.log('Delete equipment:', id);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Техника на объекте</h2>
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-gray-400" />
          <span className="text-gray-500">Всего: {facilityEquipment.length}</span>
        </div>
      </div>
      <EquipmentList
        equipment={facilityEquipment}
        onUpdateEquipment={handleUpdateEquipment}
        onDeleteEquipment={handleDeleteEquipment}
        viewType="table"
      />

      {selectedEquipment && (
        <EquipmentModal
          equipment={selectedEquipment}
          onClose={() => setSelectedEquipment(null)}
          onUpdate={handleUpdateEquipment}
          isEditing={false}
        />
      )}
    </div>
  );
}