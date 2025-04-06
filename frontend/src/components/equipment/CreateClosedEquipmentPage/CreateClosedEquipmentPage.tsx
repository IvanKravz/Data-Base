import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Equipment } from '../../../types';
import { useDispatch } from 'react-redux';
import { addEquipment } from '../../../store/slices/equipmentSlice';
import { EquipmentForm } from '../forms/EquipmentForm';

export function CreateClosedEquipmentPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const initialData: Omit<Equipment, 'id'> = {
    name: '',
    type: '',
    category: 'closed',
    status: 'in-storage',
    serialNumber: '',
    purchaseDate: '',
    inventoryNumber: '',
    manufacturingDate: '',
    division: '1 отдел'
  };

  const handleSubmit = (formData: Omit<Equipment, 'id'>) => {
    const newEquipment = {
      ...formData,
      id: Date.now().toString()
    };
    dispatch(addEquipment(newEquipment));
    navigate('/equipment-closed');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/equipment-closed')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Добавление закрытой техники</h1>
            <p className="text-sm text-gray-500 mt-1">Заполните информацию о новой технике</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <EquipmentForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/equipment-closed')}
          isClosedEquipment={true}
        />
      </div>
    </div>
  );
}