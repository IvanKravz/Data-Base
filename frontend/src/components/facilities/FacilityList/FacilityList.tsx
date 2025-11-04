import React, { memo, useCallback } from 'react';
import { Grid, Table } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Facility } from '../../../types';
import { TableView } from './views/TableView';
import { GridView } from './views/GridView';
import { ExportButton } from '../../common/ExportButton';
import { exportFacilitiesToExcel } from '../../../utils/exportToExcel';

interface FacilityListProps {
  viewType: 'grid' | 'table';
  onViewChange: (type: 'grid' | 'table') => void;
  facilities: Facility[];
  onSelectFacility?: (facility: Facility) => void;
  onLocateFacility?: (facility: Facility) => void;
  showDifferentFields?: boolean;
  onFacilityDeleted?: (deletedId: string) => void;
  onDeleteInitiated?: (id: string) => void;
  divisionId?: string; // Добавляем новые пропсы
  subdivisionId?: string;
  activeTab?: string;
  filterType?: string | null;
  facilityClassFilter?: string | null;
}

export const FacilityList = memo(function FacilityList({
  viewType,
  onViewChange,
  facilities,
  onSelectFacility,
  onLocateFacility,
  showDifferentFields = false,
  onFacilityDeleted,
  onDeleteInitiated,
  divisionId,
  subdivisionId,
  activeTab,
  filterType,
  facilityClassFilter
}: FacilityListProps) {
  const handleViewTypeChange = useCallback((type: 'grid' | 'table') => {
    onViewChange(type);
  }, [onViewChange]);

  // Убираем дополнительную фильтрацию по subdivisionId, так как она уже выполнена в FacilitiesSection
  const filteredFacilities = facilities;

  const handleDelete = useCallback((id: string) => {
    if (onDeleteInitiated) {
      onDeleteInitiated(id);
    }
  }, [onDeleteInitiated]);

  const handleExport = useCallback(() => {
    exportFacilitiesToExcel(facilities);
  }, [facilities]);

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
              onClick={handleExport}
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
                onDelete={handleDelete}
                onLocate={onLocateFacility}
                showDifferentFields={showDifferentFields}
                divisionId={divisionId}
                subdivisionId={subdivisionId}
                activeTab={activeTab}
                // ПЕРЕДАЙТЕ ФИЛЬТРЫ
                filterType={filterType}
                facilityClassFilter={facilityClassFilter}
              />
            ) : (
              <GridView
                facilities={filteredFacilities}
                onDelete={handleDelete}
                onLocate={onLocateFacility}
                divisionId={divisionId}
                subdivisionId={subdivisionId}
                activeTab={activeTab}
                // ПЕРЕДАЙТЕ ФИЛЬТРЫ
                filterType={filterType}
                facilityClassFilter={facilityClassFilter}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {filteredFacilities.length === 0 && (
          <div className="facility-list-empty-message">
            Нет объектов для отображения
          </div>
        )}
      </div>
    </div>
  );
});