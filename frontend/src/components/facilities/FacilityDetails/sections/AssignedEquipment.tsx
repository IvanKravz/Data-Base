import React, { useState, useEffect } from 'react';
import { Database, Plug } from 'lucide-react';
import { Facility, Equipment } from '../../../../types';
import { EquipmentList } from '../../../equipment/EquipmentList';
import { equipmentApi } from '../../../../api/equipment';
import '../FacilityForm.css';

interface AssignedEquipmentProps {
  facility: Facility;
}

export function AssignedEquipment({ facility }: AssignedEquipmentProps) {
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [facilityEquipment, setFacilityEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        if (!token || !facility.id) return;

        setIsLoading(true);
        setError(null);

        const data = await equipmentApi.getEquipment(token, {
          facility: facility.id.toString() // Убедимся, что передаем строку
        });

        if (data) {
          setFacilityEquipment(data);
        } else {
          setFacilityEquipment([]);
        }
      } catch (err) {
        console.error('Ошибка при загрузке техники:', err);
        setError('Не удалось загрузить список техники');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEquipment();
  }, [facility.id, token]);

  const handleUpdateEquipment = async (updatedEquipment: Equipment) => {
    try {
      if (!token) return;

      await equipmentApi.updateEquipment(
        token,
        updatedEquipment.id,
        updatedEquipment
      );

      setFacilityEquipment(prev =>
        prev.map(item =>
          item.id === updatedEquipment.id ? updatedEquipment : item
        )
      );
      setSelectedEquipment(null);
    } catch (err) {
      console.error('Ошибка при обновлении техники:', err);
      setError('Не удалось обновить данные техники');
    }
  };

  const handleDeleteEquipment = async (id: string) => {
    try {
      if (!token) return;

      await equipmentApi.deleteEquipment(id);
      setFacilityEquipment(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Ошибка при удалении техники:', err);
      setError('Не удалось удалить технику');
    }
  };

  return (
    <div className="facility-assigned-equipment">
      <div className="facility-assigned-equipment-header">
        <div className="facility-assigned-equipment-title-wrapper">
          <Plug className="facility-assigned-equipment-icon" size={22} />
          <h2 className="facility-assigned-equipment-title">Техника на объекте</h2>
        </div>
        <div className="facility-assigned-equipment-count">
          <span className="facility-assigned-equipment-count-value">
            Всего: <strong>{facilityEquipment.length}</strong>
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="facility-loading">
          <p>Загрузка списка техники...</p>
        </div>
      ) : error ? (
        <div className="facility-error">
          <p>{error}</p>
        </div>
      ) : (
        <EquipmentList
          equipment={facilityEquipment}
          onUpdateEquipment={handleUpdateEquipment}
          onDeleteEquipment={handleDeleteEquipment}
          viewType="table"
          disableRowClick={true}  
          showActions={false}   
        />
      )}
    </div>
  );
}