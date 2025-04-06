import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ArrowLeft } from 'lucide-react';
import { Facility } from '../../../types';
import { addFacility } from '../../../store/slices/facilitiesSlice';
import { FacilityForm } from '../forms/FacilityForm';

export function CreateOpenFacilityPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const initialData: Omit<Facility, 'id'> = {
    name: '',
    type: 'station',
    class: '1',
    address: '',
    division: '1 отдел'
  };

  const handleSubmit = (formData: Omit<Facility, 'id'>) => {
    const newFacility = {
      ...formData,
      id: Date.now().toString()
    };
    dispatch(addFacility(newFacility));
    navigate('/facilities-open');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/facilities-open')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Добавление открытого объекта</h1>
            <p className="text-sm text-gray-500 mt-1">Заполните информацию о новом объекте</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <FacilityForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/facilities-open')}
          isClosedFacility={false}
        />
      </div>
    </div>
  );
}