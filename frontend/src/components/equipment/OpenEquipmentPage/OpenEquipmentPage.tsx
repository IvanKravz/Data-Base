import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store/store';
import { Plus } from 'lucide-react';
import { Equipment } from '../../../types';
import { EquipmentTypeList } from '../EquipmentTypeList/EquipmentTypeList';
import { updateEquipment } from '../../../store/slices/equipmentSlice';

export function OpenEquipmentPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const equipment = useSelector((state: RootState) => state.equipment.equipment);

  const handleUpdateEquipment = (updatedEquipment: Equipment) => {
    dispatch(updateEquipment(updatedEquipment));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Открытая техника</h1>
        <button
          onClick={() => navigate('/equipment-open/create')}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>Добавить технику</span>
        </button>
      </div>

      <EquipmentTypeList
        equipment={equipment}
        onUpdateEquipment={handleUpdateEquipment}
        type="open"
      />
    </div>
  );
}