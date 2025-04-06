import React, { useState } from 'react';
import { Equipment } from '../../../types';
import { BasicInformation } from './sections/BasicInformation';
import { IdentificationInfo } from './sections/IdentificationInfo';
import { DatesInfo } from './sections/DatesInfo';
import { AssignmentInfo } from './sections/AssignmentInfo';
import { FormActions } from './sections/FormActions';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { DisposalModal } from '../DisposalModal';

interface EquipmentFormProps {
  initialData: Equipment;
  onSubmit: (data: Partial<Equipment>) => void;
  onCancel: () => void;
  isClosedEquipment?: boolean;
}

export function EquipmentForm({ 
  initialData, 
  onSubmit, 
  onCancel,
  isClosedEquipment = false 
}: EquipmentFormProps) {
  const [formData, setFormData] = useState<Partial<Equipment>>({
    ...initialData,
    comments: initialData.comments || ''
  });
  const [showDisposalModal, setShowDisposalModal] = useState(false);

  const personnel = useSelector((state: RootState) => state.personnel.personnel);
  const facilities = useSelector((state: RootState) => state.facilities.facilities);

  const handleChange = (data: Partial<Equipment>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleDispose = (disposalInfo: {
    actNumber?: string;
    actDate?: string;
    certNumber?: string;
    certDate?: string;
    comments?: string;
  }) => {
    onSubmit({
      ...formData,
      status: 'disposed',
      disposal_act_number: disposalInfo.actNumber,
      disposal_act_date: disposalInfo.actDate,
      disposal_cert_number: disposalInfo.certNumber,
      disposal_cert_date: disposalInfo.certDate,
      disposal_comments: disposalInfo.comments
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        <BasicInformation 
          formData={formData}
          onChange={handleChange}
          isClosedEquipment={isClosedEquipment}
          isDisposed={formData.status === 'disposed'}
        />

        <IdentificationInfo 
          formData={formData}
          onChange={handleChange}
        />

        <DatesInfo 
          formData={formData}
          onChange={handleChange}
        />

        <AssignmentInfo 
          formData={formData}
          onChange={handleChange}
          availablePersonnel={personnel}
          availableFacilities={facilities}
        />

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

        <FormActions 
          onCancel={onCancel}
          showDisposeButton={formData.status !== 'disposed'}
          onDispose={() => setShowDisposalModal(true)}
        />
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