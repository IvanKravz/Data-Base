import React from 'react';
import { CreateModal } from '../modals/CreateModal';
import { CreateEquipmentForm } from '../forms/equipment/CreateEquipmentForm';
import { CreatePersonnelForm } from '../forms/personnel/CreatePersonnelForm';
import { CreateFacilityForm } from '../forms/facility/CreateFacilityForm';
import { Equipment, Person, Facility } from '../../types';

interface CreateModalWrapperProps {
  activeTab: string;
  showCreateModal: boolean;
  equipment: Equipment[];
  personnel: Person[];
  facilities: Facility[];
  onSetShowCreateModal: (show: boolean) => void;
  onEquipmentUpdate: (equipment: Equipment[]) => void;
  onPersonnelUpdate: (personnel: Person[]) => void;
  onFacilitiesUpdate: (facilities: Facility[]) => void;
}

export function CreateModalWrapper({
  activeTab,
  showCreateModal,
  equipment,
  personnel,
  facilities,
  onSetShowCreateModal,
  onEquipmentUpdate,
  onPersonnelUpdate,
  onFacilitiesUpdate
}: CreateModalWrapperProps) {
  if (!showCreateModal) return null;

  return (
    <CreateModal
      title={
        activeTab === 'equipment' ? 'Добавить технику' :
        activeTab === 'personnel' ? 'Добавить сотрудника' :
        'Добавить объект'
      }
      onClose={() => onSetShowCreateModal(false)}
    >
      {activeTab === 'equipment' ? (
        <CreateEquipmentForm
          onSubmit={(newEquipment) => {
            onEquipmentUpdate([...equipment, { ...newEquipment, id: Date.now().toString() }]);
            onSetShowCreateModal(false);
          }}
          onCancel={() => onSetShowCreateModal(false)}
          equipment={equipment}
        />
      ) : activeTab === 'personnel' ? (
        <CreatePersonnelForm
          onSubmit={(newPerson) => {
            onPersonnelUpdate([...personnel, { ...newPerson, id: Date.now().toString() }]);
            onSetShowCreateModal(false);
          }}
          onCancel={() => onSetShowCreateModal(false)}
        />
      ) : (
        <CreateFacilityForm
          onSubmit={(newFacility) => {
            onFacilitiesUpdate([...facilities, { ...newFacility, id: Date.now().toString() }]);
            onSetShowCreateModal(false);
          }}
          onCancel={() => onSetShowCreateModal(false)}
        />
      )}
    </CreateModal>
  );
}