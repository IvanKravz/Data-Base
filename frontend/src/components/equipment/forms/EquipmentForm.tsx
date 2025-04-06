import React, { useState } from 'react';
import { Equipment, DisposalInfo } from '../../../types';
import { BasicInformation } from './sections/BasicInformation';
import { IdentificationInfo } from './sections/IdentificationInfo';
import { DatesInfo } from './sections/DatesInfo';
import { AssignmentInfo } from './sections/AssignmentInfo';
import { FormActions } from './sections/FormActions';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { DisposalModal } from '../DisposalModal';

interface EquipmentFormProps {
  initialData: Omit<Equipment, 'id'>;
  onSubmit: (data: Omit<Equipment, 'id'>) => void;
  onCancel: () => void;
  isClosedEquipment?: boolean;
}

export function EquipmentForm({ 
  initialData, 
  onSubmit, 
  onCancel,
  isClosedEquipment = false 
}: EquipmentFormProps) {
  const [formData, setFormData] = useState({
    ...initialData,
    comments: initialData.comments || ''
  });
  const [showDisposalModal, setShowDisposalModal] = useState(false);

  // Get personnel and facilities from Redux store for assignment
  const personnel = useSelector((state: RootState) => state.personnel.personnel);
  const facilities = useSelector((state: RootState) => state.facilities.facilities);

  // Get available subdivisions based on selected division
  const availableSubdivisions = formData.division === '1 отдел'
    ? ['Отделение A', 'Отделение B', 'Отделение C']
    : formData.division === '2 отдел'
      ? ['Отделение D', 'Отделение E', 'Отделение F']
      : [];

  // Filter personnel and facilities based on division/subdivision
  const availablePersonnel = personnel.filter(person => {
    const matchesDivision = person.division === formData.division;
    const matchesSubdivision = !formData.subdivision || person.subdivision === formData.subdivision;
    return matchesDivision && matchesSubdivision;
  });

  const availableFacilities = facilities.filter(facility => {
    const matchesDivision = facility.division === formData.division;
    const matchesSubdivision = !formData.subdivision || facility.subdivision === formData.subdivision;
    const matchesType = isClosedEquipment ? facility.type === 'shd' : facility.type === 'station';
    return matchesDivision && matchesSubdivision && matchesType;
  });

  const handleChange = (data: Partial<Equipment>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleDispose = (disposalInfo: DisposalInfo) => {
    onSubmit({
      ...formData,
      status: 'disposed',
      disposalInfo
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <h3 className="font-medium text-gray-900 mb-4">Основная информация</h3>
          <BasicInformation 
            formData={formData}
            onChange={handleChange}
            isClosedEquipment={isClosedEquipment}
            isDisposed={formData.status === 'disposed'}
          />
        </div>

        <div>
          <h3 className="font-medium text-gray-900 mb-4">Идентификация</h3>
          <IdentificationInfo 
            formData={formData}
            onChange={handleChange}
          />
        </div>

        <div>
          <h3 className="font-medium text-gray-900 mb-4">Даты</h3>
          <DatesInfo 
            formData={formData}
            onChange={handleChange}
          />
        </div>

        <div>
          <h3 className="font-medium text-gray-900 mb-4">Принадлежность</h3>
          <AssignmentInfo 
            formData={formData}
            onChange={handleChange}
            availableSubdivisions={availableSubdivisions}
            availablePersonnel={availablePersonnel}
            availableFacilities={availableFacilities}
          />
        </div>

        <div>
          <h3 className="font-medium text-gray-900 mb-4">Комментарии</h3>
          <textarea
            value={formData.comments || ''}
            onChange={(e) => handleChange({ comments: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
            placeholder="Добавьте комментарии к технике..."
          />
        </div>

        <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
          {formData.status !== 'disposed' && (
            <button
              type="button"
              onClick={() => setShowDisposalModal(true)}
              className="px-6 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 shadow-sm hover:shadow transition-all"
            >
              Списать
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 text-sm font-medium bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-colors"
          >
            Отмена
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm hover:shadow transition-all"
          >
            Сохранить
          </button>
        </div>
      </form>

      {showDisposalModal && (
        <DisposalModal
          onConfirm={(disposalInfo) => {
            handleDispose(disposalInfo);
            setShowDisposalModal(false);
          }}
          onCancel={() => setShowDisposalModal(false)}
        />
      )}
    </>
  );
}