import React, { useState } from 'react';
import { Facility } from '../../../../types';
import { Trash2, ChevronUp, ChevronDown } from 'lucide-react';

interface TableViewProps {
  facilities: Facility[];
  onFacilityClick: (facility: Facility) => void;
  onDelete: (id: string) => void;
}

type SortField = keyof Facility;
type SortDirection = 'asc' | 'desc';

export function TableView({ facilities, onFacilityClick, onDelete }: TableViewProps) {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedFacilities = [...facilities].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    if (sortField === 'type') {
      aValue = a.type === 'station' ? 'Станция' : 'ШД';
      bValue = b.type === 'station' ? 'Станция' : 'ШД';
    }

    if (aValue === bValue) return 0;
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    const result = String(aValue).localeCompare(String(bValue));
    return sortDirection === 'asc' ? result : -result;
  });

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <div className="w-4 h-4 opacity-0 group-hover:opacity-30">
          <ChevronUp className="h-2 w-4" />
          <ChevronDown className="h-2 w-4 -mt-1" />
        </div>
      );
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  const renderHeaderCell = (field: SortField, label: string) => (
    <th 
      onClick={() => handleSort(field)}
      className="group px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center gap-1">
        <span className="flex-1">{label}</span>
        {renderSortIcon(field)}
      </div>
    </th>
  );

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {renderHeaderCell('name', 'Наименование')}
            {renderHeaderCell('type', 'Тип')}
            {renderHeaderCell('class', 'Класс')}
            {renderHeaderCell('address', 'Адрес')}
            {renderHeaderCell('division', 'Подразделение')}
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Действия
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedFacilities.map((facility) => (
            <tr 
              key={facility.id} 
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => onFacilityClick(facility)}
            >
              <td className="px-4 py-2 whitespace-nowrap text-gray-900">
                {facility.name}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-gray-500">
                {facility.type === 'station' ? 'Станция' : 'ШД'}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-gray-500">
                {facility.class} класс
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-gray-500">
                {facility.address}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-gray-500">
                {facility.division}
                {facility.subdivision && ` - ${facility.subdivision}`}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-right">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(facility.id);
                  }}
                  className="p-1.5 rounded-lg transition-colors hover:bg-red-50 text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {sortedFacilities.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Нет объектов
        </div>
      )}
    </div>
  );
}