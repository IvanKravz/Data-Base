import React from 'react';
import { Facility } from '../../../types';
import { OpenFacilityForm } from './OpenFacilityForm';
import { ClosedFacilityForm } from './ClosedFacilityForm';

interface FacilityFormProps {
  initialData: Omit<Facility, 'id'>;
  onSubmit: (data: Omit<Facility, 'id'>) => void;
  onCancel: () => void;
  isClosedFacility?: boolean;
  isEditing?: boolean;
}

export function FacilityForm({ 
  initialData, 
  onSubmit, 
  onCancel,
  isClosedFacility = false,
  isEditing = false
}: FacilityFormProps) {
  if (isClosedFacility) {
    return (
      <ClosedFacilityForm
        initialData={initialData}
        onSubmit={onSubmit}
        onCancel={onCancel}
        isEditing={isEditing}
      />
    );
  }

  return (
    <OpenFacilityForm
      initialData={initialData}
      onSubmit={onSubmit}
      onCancel={onCancel}
      isEditing={isEditing}
    />
  );
}