import React, { useState } from 'react';
import { Facility } from '../../../../types';
import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import '../style.css';

interface TableViewProps {
  facilities: Facility[];
  onFacilityClick: (facility: Facility) => void;
  onDelete: (id: string) => void;
  showDifferentFields?: boolean;
}

type SortField = keyof Facility;
type SortDirection = 'asc' | 'desc';

export function TableView({ facilities, onFacilityClick, onDelete, showDifferentFields = false }: TableViewProps) {
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
      aValue = a.type.name;
      bValue = b.type.name;
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
        <div className="facility-sort-icon-container">
          <ChevronUp className="facility-sort-icon-small" />
          <ChevronDown className="facility-sort-icon-small" style={{ marginTop: -2 }} />
        </div>
      );
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="facility-sort-icon" />
    ) : (
      <ChevronDown className="facility-sort-icon" />
    );
  };

  const renderHeaderCell = (field: SortField, label: string) => (
    <th
      onClick={() => handleSort(field)}
      className="facility-table-header"
    >
      <div className="facility-table-header-content">
        <span>{label}</span>
        {renderSortIcon(field)}
      </div>
    </th>
  );

  const renderHeader = () => {
    if (!showDifferentFields) {
      return (
        <>
          {renderHeaderCell('name', 'Наименование')}
          {renderHeaderCell('type', 'Тип')}
          {renderHeaderCell('facility_class', 'Класс')}
          {renderHeaderCell('address', 'Адрес')}
          {renderHeaderCell('division_name', 'Подразделение')}
        </>
      );
    }

    return (
      <>
        {renderHeaderCell('name', 'Наименование')}
        {renderHeaderCell('type', 'Тип')}
        {facilities.some(f => f.is_closed) && renderHeaderCell('facility_class', 'Класс')}
        {renderHeaderCell('communication_posts', 'Посты связи')}
        {renderHeaderCell('address', 'Адрес')}
        {renderHeaderCell('division_name', 'Подразделение')}
        {facilities.some(f => f.is_closed) && renderHeaderCell('inn', 'ИНН')}
      </>
    );
  };

  const renderRow = (facility: Facility) => {
    return (
      <>
        <td className="facility-table-cell facility-table-cell-primary">
          {facility.name}
        </td>
        <td className="facility-table-cell">
          {facility.type.name}
        </td>
        {facility.is_closed && (
          <td className="facility-table-cell">
            {facility.facility_class} класс
          </td>
        )}
        <td className="facility-table-cell">
          {facility.communication_posts?.map(post => post.name).join(', ') || '-'}
        </td>

        <td className="facility-table-cell">
          {facility.address}
        </td>
        <td className="facility-table-cell">
          {facility.division_name} / {facility.subdivision_name}
        </td>
        {facility.is_closed && (
          <td className="facility-table-cell">
            {facility.inn}
          </td>
        )}
      </>
    );
  };

  return (
    <div className="facility-table-container">
      <table className="facility-table">
        <thead>
          <tr>
            {renderHeader()}
            <th className="facility-table-header facility-table-cell-actions">
              Действия
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedFacilities.map((facility) => (
            <tr
              key={facility.id}
              className="facility-table-row"
              onClick={() => onFacilityClick(facility)}
            >
              {renderRow(facility)}
              <td className="facility-table-cell facility-table-cell-actions">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(facility.id);
                  }}
                  className="facility-delete-btn"
                  aria-label="Удалить объект"
                >
                  <Trash2 className="facility-sort-icon" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}