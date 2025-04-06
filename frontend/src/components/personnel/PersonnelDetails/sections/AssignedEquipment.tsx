// AssignedEquipment.tsx
import React, { useState, useEffect } from 'react';
import { HardDrive } from 'lucide-react';
import { Employee, Equipment } from '../../../../types';
import { EquipmentList } from '../../../equipment/EquipmentList';
import { EquipmentModal } from '../../../equipment/EquipmentModal';
import { equipmentApi } from '../../../../api/equipment';

interface AssignedEquipmentProps {
  person: Employee;
  id: string;
}

export function AssignedEquipment({ person, id }: AssignedEquipmentProps) {
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [assignedEquipment, setAssignedEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    const fetchAssignedEquipment = async () => {
      try {
        if (token && id) {
          const data = await equipmentApi.getEquipmentByEmployee(token, id);
          setAssignedEquipment(data);
        }
      } catch (err) {
        setError('Не удалось загрузить закрепленную технику');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedEquipment();
  }, [token, id]);

  const handleUpdateEquipment = (updatedEquipment: Equipment) => {
    setAssignedEquipment(prev =>
      prev.map(item => item.id === updatedEquipment.id ? updatedEquipment : item)
    );
    setSelectedEquipment(null);
  };

  const handleDeleteEquipment = (id: string) => {
    setAssignedEquipment(prev => prev.filter(item => item.id !== id));
  };

  if (loading) {
    return <div className="text-center py-4">Загрузка...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">{error}</div>;
  }

  return (
    <div className="equipment-container">
      <div className="equipment-header">
        <h2 className="equipment-title">Закрепленная техника</h2>
        <div className="equipment-summary">
          <HardDrive className="equipment-summary-icon" />
          <span className="equipment-summary-text">Всего: {assignedEquipment.length}</span>
        </div>
      </div>
      <EquipmentList
        equipment={assignedEquipment}
        onUpdateEquipment={handleUpdateEquipment}
        onDeleteEquipment={handleDeleteEquipment}
        // viewType="table"
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