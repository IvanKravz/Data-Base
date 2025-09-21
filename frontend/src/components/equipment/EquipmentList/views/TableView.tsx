import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Equipment } from '../../../../types';
import { Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { getStatusIcon, getStatusLabel, getStatusColor } from '../../../../utils/statusUtils';
import { equipmentApi } from '../../../../api';
import { format } from 'date-fns';
import './style.css';

interface TableViewProps {
  equipment: Equipment[];
  onEdit: (e: React.MouseEvent, item: Equipment) => void;
  onDelete: (id: string) => void;
}

export function TableView({ equipment, onEdit, onDelete }: TableViewProps) {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<keyof Equipment>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [equipmentCategories, setEquipmentCategories] = useState<Record<string, string>>({});



  const handleSort = (field: keyof Equipment) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleRowClick = (item: Equipment) => {
    navigate(`/equipment/${item.id}`);
  };

  // Функция для форматирования даты в формат DD.MM.YYYY
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      // Проверяем, что дата валидна
      if (isNaN(date.getTime())) return '-';
      
      return format(date, 'dd.MM.yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return '-';
    }
  };

  const sortedEquipment = [...equipment].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    if (sortField === 'category') {
      aValue = a.category_display ||
        (equipmentCategories && a.open_category ? equipmentCategories[a.open_category] : '') ||
        'Без категории';
      bValue = b.category_display ||
        (equipmentCategories && b.open_category ? equipmentCategories[b.open_category] : '') ||
        'Без категории';
    } else if (sortField === 'status') {
      aValue = getStatusLabel(a.status);
      bValue = getStatusLabel(b.status);
    }

    if (sortField === 'manufacturingDate' || sortField === 'exploitation_date') {
      aValue = new Date(a[sortField]).getTime();
      bValue = new Date(b[sortField]).getTime();
    }

    if (aValue === bValue) return 0;
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    const result = aValue > bValue ? 1 : -1;
    return sortDirection === 'asc' ? result : -result;
  });

  const renderSortIcon = (field: keyof Equipment) => {
    if (sortField !== field) {
      return (
        <div className="sort-icon inactive">
          <ChevronUp className="sort-icon-up" />
          <ChevronDown className="sort-icon-down" />
        </div>
      );
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="sort-icon active" />
    ) : (
      <ChevronDown className="sort-icon active" />
    );
  };

  const renderHeaderCell = (field: keyof Equipment, label: string) => (
    <th
      onClick={() => handleSort(field)}
      className={`table-header-cell ${sortField === field ? 'active' : ''}`}
    >
      <div className="header-cell-content">
        <span className="header-cell-label">{label}</span>
        {renderSortIcon(field)}
      </div>
    </th>
  );

  const formatEmployeeName = (employee: { full_name: string }) => {
    if (!employee?.full_name) return '-';

    const parts = employee.full_name.split(' ');
    if (parts.length < 3) return employee.full_name; // Если нет отчества

    const lastName = parts[0];
    const firstNameInitial = parts[1] ? `${parts[1][0]}.` : '';
    const middleNameInitial = parts[2] ? `${parts[2][0]}.` : '';

    return `${lastName} ${firstNameInitial}${middleNameInitial}`;
  };

  return (
    <div className="table-container">
      <table className="equipment-table">
        <thead className="table-header">
          <tr>
            {renderHeaderCell('name', 'Название')}
            {renderHeaderCell('type', 'Модель')}
            {renderHeaderCell('category', 'Категория')}
            {renderHeaderCell('status', 'Статус')}
            {renderHeaderCell('division', 'Подразделение')}
            {renderHeaderCell('serial_number', 'Серийный номер')}
            {renderHeaderCell('inventory_number', 'Инв. номер')}
            {renderHeaderCell('manufacturing_date', 'Дата производства')}
            {renderHeaderCell('exploitation_date', 'Дата ввода в экспл.')}
            {/* {renderHeaderCell('facility', 'Объект')} */}
            {renderHeaderCell('assigned_to', 'Закреплено за')}
            <th className="table-header-actions">Действия</th>
          </tr>
        </thead>
        <tbody className="table-body">
          {sortedEquipment.map((item) => {
            const StatusIcon = getStatusIcon(item.status);
            return (
              <tr
                key={item.id}
                onClick={() => handleRowClick(item)}
                className="table-row"
              >
                <td className="table-cell">
                  <div className="cell-content">{item.name}</div>
                </td>
                <td className="table-cell">
                  <div className="cell-content">{item.type}</div>
                </td>
                <td className="table-cell">
                  <div className="cell-content">{item.category_display}</div>
                </td>
                <td className="table-cell">
                  <div className={`cell-content ${getStatusColor(item.status)}`}>
                    <StatusIcon className="status-icon" />
                    {getStatusLabel(item.status)}
                  </div>
                </td>
                <td className="table-cell">
                  <div className="cell-content">
                    {item.division.name}
                  </div>
                  {item.subdivision?.name && `  ${item.subdivision.name}`}
                </td>
                <td className="table-cell">
                  <div className="cell-content">{item.serial_number}</div>
                </td>
                <td className="table-cell">
                  <div className="cell-content">{item.inventory_number}</div>
                </td>
                <td className="table-cell">
                  <div className="cell-content">{formatDate(item.manufacturing_date)}</div>
                </td>
                <td className="table-cell">
                  <div className="cell-content">{formatDate(item.exploitation_date)}</div>
                </td>
                {/* <td className="table-cell">
                  <div className="cell-content">{item.facility ? item.facility?.name : '-'}</div>
                </td> */}
                <td className="table-cell table-cell-assigned-to">
                  <div className="cell-content">
                    {item.assigned_to ? (
                      <>
                        <span>{formatEmployeeName(item.assigned_to)}</span>
                        {item.assigned_to.position && (
                          <span className="position-text">
                            {item.assigned_to.position}
                          </span>
                        )}
                      </>
                    ) : (
                      '-'
                    )}
                  </div>
                </td>
                <td className="table-cell-actions">
                  <div className="actions-container">
                    {/* <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(e, item);
                      }}
                      className="edit-button"
                      aria-label="Редактировать"
                    >
                      <Pencil className="action-icon" />
                    </button> */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item.id);
                      }}
                      className="delete-button"
                      aria-label="Удалить"
                    >
                      <Trash2 className="action-icon" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}