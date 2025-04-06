import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ArrowLeft } from 'lucide-react';
import { Person } from '../../../types';
import { addPerson } from '../../../store/slices/personnelSlice';
import { CreatePersonnelForm } from '../../forms/personnel/CreatePersonnelForm';

export function CreatePersonnelPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = (formData: Omit<Person, 'id'>) => {
    const newPerson = {
      ...formData,
      id: Date.now().toString()
    };
    dispatch(addPerson(newPerson));
    navigate('/personnel');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/personnel')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Добавление сотрудника</h1>
            <p className="text-sm text-gray-500 mt-1">Заполните информацию о новом сотруднике</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <CreatePersonnelForm
          onSubmit={handleSubmit}
          onCancel={() => navigate('/personnel')}
        />
      </div>
    </div>
  );
}