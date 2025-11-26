// hooks/useEquipmentPermissions.ts
import { useMemo } from 'react';
import { EquipmentFieldPermissions } from '../../../../../types';
import { canEdit, hasRole } from '../../../../../api/utils/permissions';

export const useEquipmentPermissions = (): EquipmentFieldPermissions => {
  return useMemo(() => {
    const hasEditPermission = canEdit('equipment');
    const isAdmin = hasRole('admin');
    const isExploitationEmployee = hasRole('exploitation_employee');

    // Администратор имеет все права
    if (isAdmin) {
      return {
        canEditName: true,
        canEditCategory: true,
        canEditModel: true,
        canEditStatus: true,
        canEditSoftwareVersion: true,
        canEditManufacturingDate: true,
        canEditExploitationDate: true,
        canEditServiceLife: true,
        canEditSecretLevel: true,
        canEditInterestOrgan: true,
        canEditFreeUse: true,
        canEditDivision: true,
        canEditSubdivision: true,
        canEditAssignedTo: true,
        canEditFacility: true,
        canEditComments: true,
        canEditProductStructure: true,
        canEditDocuments: true,
        canEditIdentification: true,
      };
    }

    // Сотрудник эксплуатации - ограниченные права
    if (isExploitationEmployee && hasEditPermission) {
      return {
        canEditName: false,
        canEditCategory: false,
        canEditModel: true,
        canEditStatus: true,
        canEditSoftwareVersion: true,
        canEditManufacturingDate: false,
        canEditExploitationDate: false,
        canEditServiceLife: true,
        canEditSecretLevel: true,
        canEditInterestOrgan: true,
        canEditFreeUse: false,
        canEditDivision: false,
        canEditSubdivision: false,
        canEditAssignedTo: false,
        canEditFacility: true,
        canEditComments: true,
        canEditProductStructure: true,
        canEditDocuments: false,
        canEditIdentification: false,
      };
    }

    // Другие пользователи с правом редактирования - все права
    if (hasEditPermission) {
      return {
        canEditName: true,
        canEditCategory: true,
        canEditModel: true,
        canEditStatus: true,
        canEditSoftwareVersion: true,
        canEditManufacturingDate: true,
        canEditExploitationDate: true,
        canEditServiceLife: true,
        canEditSecretLevel: true,
        canEditInterestOrgan: true,
        canEditFreeUse: true,
        canEditDivision: true,
        canEditSubdivision: true,
        canEditAssignedTo: true,
        canEditFacility: true,
        canEditComments: true,
        canEditProductStructure: true,
        canEditDocuments: true,
        canEditIdentification: true,
      };
    }

    // Нет прав на редактирование
    return {
      canEditName: false,
      canEditCategory: false,
      canEditModel: false,
      canEditStatus: false,
      canEditSoftwareVersion: false,
      canEditManufacturingDate: false,
      canEditExploitationDate: false,
      canEditServiceLife: false,
      canEditSecretLevel: false,
      canEditInterestOrgan: false,
      canEditFreeUse: false,
      canEditDivision: false,
      canEditSubdivision: false,
      canEditAssignedTo: false,
      canEditFacility: false,
      canEditComments: false,
      canEditProductStructure: false,
      canEditDocuments: false,
      canEditIdentification: false,
    };
  }, []);
};