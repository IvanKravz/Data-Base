import React from 'react';
import { Facility } from '../../../../types';
// import { OpenFacilityForm, ClosedFacilityForm } from '../../../facilities/forms';

interface EditFacilityFormProps {
  facility: Facility;
  onSubmit: (facility: Facility) => void;
  onCancel: () => void;
}

export function EditFacilityForm({ facility, onSubmit, onCancel }: EditFacilityFormProps) {
  const isOpenFacility = facility.type === 'station';

  const handleSubmit = (formData: Omit<Facility, 'id'>) => {
    onSubmit({
      ...formData,
      id: facility.id
    });
  };

  if (isOpenFacility) {
    return (
      <OpenFacilityForm
        initialData={facility}
        onSubmit={handleSubmit}
        onCancel={onCancel}
      />
    );
  }

  return (
    <ClosedFacilityForm
      initialData={facility}
      onSubmit={handleSubmit}
      onCancel={onCancel}
    />
  );
}