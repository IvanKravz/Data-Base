import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { Facility } from '../../../types';
import { TableView } from './views/TableView';
import { GridView } from './views/GridView';
import { DeleteConfirmationModal } from '../../modals/DeleteConfirmationModal';
import { ExportButton } from '../../common/ExportButton';
import { exportFacilitiesToExcel } from '../../../utils/exportToExcel';
import { deleteFacility } from '../../../store/slices/facilitiesSlice';

interface FacilityListProps {
  viewType: 'grid' | 'table';
  type: 'open' | 'closed';
  onSelectFacility?: (facility: Facility) => void;
  selectedDivision: string;
  searchTerm: string;
  filterType: 'all' | 'station' | 'shd';
  facilityClassFilter: 'all' | '1' | '2';
}

export function FacilityList({ 
  viewType, 
  type,
  onSelectFacility,
  selectedDivision,
  searchTerm = '',
  filterType,
  facilityClassFilter
}: FacilityListProps) {
  const dispatch = useDispatch();
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [facilityToDelete, setFacilityToDelete] = React.useState<string | null>(null);

  // Get facilities from Redux store and filter them
  const facilities = useSelector((state: RootState) => {
    const allFacilities = state.facilities.facilities.filter(f => 
      type === 'open' ? f.type === 'station' : f.type === 'shd'
    );

    return allFacilities.filter(facility => {
      const matchesDivision = selectedDivision === 'all' || facility.division === selectedDivision;
      const matchesSearch = !searchTerm || 
        facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        facility.address.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || facility.type === filterType;
      const matchesClass = facilityClassFilter === 'all' || facility.class === facilityClassFilter;
      return matchesDivision && matchesSearch && matchesType && matchesClass;
    });
  });

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

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-end">
          <ExportButton 
            onClick={() => exportFacilitiesToExcel(facilities)}
            label={`Экспорт ${type === 'open' ? 'открытых' : 'закрытых'} объектов`}
          />
        </div>
      </div>

      <div className="p-4">
        {viewType === 'table' ? (
          <TableView
            facilities={facilities}
            onFacilityClick={onSelectFacility}
            onDelete={handleDelete}
          />
        ) : (
          <GridView
            facilities={facilities}
            onFacilityClick={onSelectFacility}
            onDelete={handleDelete}
          />
        )}

        {facilities.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm 
              ? 'Нет объектов, соответствующих поиску' 
              : `Нет ${type === 'open' ? 'открытых' : 'закрытых'} объектов`}
          </div>
        )}
      </div>

      {showDeleteModal && (
        <DeleteConfirmationModal
          title="Удаление объекта"
          message="Вы уверены, что хотите удалить этот объект? Это действие нельзя отменить."
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setFacilityToDelete(null);
          }}
        />
      )}
    </div>
  );
}