import React from 'react';
import { useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { Grid, Table } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Facility } from '../../../types';
import { TableView } from './views/TableView';
import { GridView } from './views/GridView';
import { DeleteConfirmationModal } from '../../modals/DeleteConfirmationModal';
import { ExportButton } from '../../common/ExportButton';
import { exportFacilitiesToExcel } from '../../../utils/exportToExcel';
import { deleteFacility } from '../../../store/slices/facilitiesSlice';
import { facilitiesApi } from '../../../api/facilities'; // Добавляем импорт API

interface FacilityListProps {
  viewType: 'grid' | 'table';
  onViewChange: (type: 'grid' | 'table') => void;
  facilities: Facility[];
  onSelectFacility?: (facility: Facility) => void;
  showDifferentFields?: boolean;
  onFacilityDeleted?: (deletedId: string) => void;
}

export function FacilityList({
  viewType,
  onViewChange,
  facilities,
  onSelectFacility,
  showDifferentFields = false,
  onFacilityDeleted
}: FacilityListProps) {
  // Удаляем локальное состояние viewType, так как оно теперь управляется извне
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [facilityToDelete, setFacilityToDelete] = React.useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const subdivisionId = searchParams.get('subdivision');

  // Изменяем обработчики кнопок
  const handleViewTypeChange = (type: 'grid' | 'table') => {
    onViewChange(type);
  };

  const filteredFacilities = subdivisionId
    ? facilities.filter(facility => facility.subdivision == subdivisionId)
    : facilities;

  const handleDelete = (id: string) => {
    setFacilityToDelete(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (facilityToDelete) {
      try {
        await facilitiesApi.deleteFacility(facilityToDelete);
        dispatch(deleteFacility(facilityToDelete));
        // Вызываем колбэк после успешного удаления
        if (onFacilityDeleted) {
          onFacilityDeleted(facilityToDelete);
        }
      } catch (error) {
        console.error('Ошибка при удалении объекта:', error);
      } finally {
        setShowDeleteModal(false);
        setFacilityToDelete(null);
      }
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setFacilityToDelete(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-3 border-b border-gray-200">
        <div className="flex justify-end">
          <div className="flex items-center gap-4">
            <div className="flex rounded-md shadow-sm">
              <button
                onClick={() => handleViewTypeChange('table')}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-l-md ${viewType === 'table'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
              >
                <Table className="h-4 w-4" />
                Таблица
              </button>
              <button
                onClick={() => handleViewTypeChange('grid')}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-r-md ${viewType === 'grid'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
              >
                <Grid className="h-4 w-4" />
                Плитка
              </button>
            </div>
            <ExportButton
              onClick={() => exportFacilitiesToExcel(facilities)}
              label="Экспорт объектов"
            />
          </div>
        </div>
      </div>

      <div>
        <AnimatePresence mode="wait">
          <motion.div
            key={viewType}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-1"
          >
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
          </motion.div>
        </AnimatePresence>

        {filteredFacilities.length === 0 && (
          <div className="facility-list-empty-message">
            {searchParams.get('search')
              ? 'Нет объектов, соответствующих поиску'
              : subdivisionId
                ? 'Нет объектов в выбранном подразделении'
                : 'Нет объектов для отображения'}
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