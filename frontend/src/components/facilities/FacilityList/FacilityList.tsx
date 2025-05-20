import React from 'react';
import { useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { Facility } from '../../../types';
import { TableView } from './views/TableView';
import { GridView } from './views/GridView';
import { DeleteConfirmationModal } from '../../modals/DeleteConfirmationModal';
import { ExportButton } from '../../common/ExportButton';
import { exportFacilitiesToExcel } from '../../../utils/exportToExcel';
import { deleteFacility } from '../../../store/slices/facilitiesSlice';

interface FacilityListProps {
  viewType: 'grid' | 'table';
  facilities: Facility[];
  onSelectFacility?: (facility: Facility) => void;
  showDifferentFields?: boolean;
}

export function FacilityList({
  viewType = 'table',
  facilities,
  onSelectFacility,
  showDifferentFields = false
}: FacilityListProps) {
  const dispatch = useDispatch();
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [facilityToDelete, setFacilityToDelete] = React.useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const subdivisionId = searchParams.get('subdivision');

  const filteredFacilities = subdivisionId
    ? facilities.filter(facility => facility.subdivision == subdivisionId)
    : facilities;

  const handleDelete = (id: string) => {
    setFacilityToDelete(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (facilityToDelete) {
      dispatch(deleteFacility(facilityToDelete));
      setShowDeleteModal(false);
      setFacilityToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setFacilityToDelete(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-end">
          <ExportButton
            onClick={() => exportFacilitiesToExcel(facilities)}
            label="Экспорт объектов"
          />
        </div>
      </div>

      <div className="p-4">
        {viewType === 'table' ? (
          <TableView
            facilities={filteredFacilities}
            onFacilityClick={onSelectFacility}
            onDelete={handleDelete}
            showDifferentFields={showDifferentFields}
          />
        ) : (
          <GridView
            facilities={filteredFacilities}
            onFacilityClick={onSelectFacility}
            onDelete={handleDelete}
            showDifferentFields={showDifferentFields}
          />
        )}

        {facilities.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Нет объектов для отображения
          </div>
        )}
      </div>

      {showDeleteModal && (
        <DeleteConfirmationModal
          title="Удаление объекта"
          message="Вы уверены, что хотите удалить этот объект? Это действие нельзя отменить."
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </div>
  );
}