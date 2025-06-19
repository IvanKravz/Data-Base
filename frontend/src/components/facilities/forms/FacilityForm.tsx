import React from 'react';
import { Facility } from '../../../types';


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
      <div
      />
    );
  }

  return (
    <div
    />
  );
}