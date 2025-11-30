// hooks/useEquipmentFieldPermissions.ts
import { useMemo } from 'react';
import { EquipmentFieldPermissions } from '../../types';
import { useAppPermissions } from './AppPermissionsContext';

// Выносим базовые права в константу
const BASE_PERMISSIONS: EquipmentFieldPermissions = {
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

export const useEquipmentFieldPermissions = (): EquipmentFieldPermissions => {
  const { canEdit, hasRole } = useAppPermissions();
  
  return useMemo(() => {
    try {
      const hasEditPermission = canEdit('equipment');
      const isAdmin = hasRole('admin');
      const isExploitationEmployee = hasRole('exploitation_employee');

      // Базовый объект с правами по умолчанию (false)
      const basePermissions = { ...BASE_PERMISSIONS };

      // Администратор имеет все права
      if (isAdmin) {
        return Object.keys(basePermissions).reduce((acc, key) => {
          acc[key as keyof EquipmentFieldPermissions] = true;
          return acc;
        }, {} as EquipmentFieldPermissions);
      }

      // Сотрудник эксплуатации - ограниченные права
      if (isExploitationEmployee && hasEditPermission) {
        return {
          ...basePermissions,
          canEditModel: true,
          canEditStatus: true,
          canEditSoftwareVersion: true,
          canEditServiceLife: true,
          canEditSecretLevel: true,
          canEditInterestOrgan: true,
          canEditFacility: true,
          canEditComments: true,
          canEditProductStructure: true,
        };
      }

      // Другие пользователи с правом редактирования - все права
      if (hasEditPermission) {
        return Object.keys(basePermissions).reduce((acc, key) => {
          acc[key as keyof EquipmentFieldPermissions] = true;
          return acc;
        }, {} as EquipmentFieldPermissions);
      }

      // Нет прав на редактирование - возвращаем базовые права (все false)
      return basePermissions;
    } catch (error) {
      console.error('Error calculating equipment field permissions:', error);
      return BASE_PERMISSIONS;
    }
  }, [canEdit, hasRole]);
};