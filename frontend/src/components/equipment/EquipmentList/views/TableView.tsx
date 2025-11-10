// TableView.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Equipment } from '../../../../types';
import { Trash2 } from 'lucide-react';
import { getStatusIcon, getStatusLabel, getStatusColor } from '../../../../utils/statusUtils';
import { format } from 'date-fns';
import './style.css';

interface TableViewProps {
  equipment: Equipment[];
  onDelete: (id: string) => void;
  divisionId?: string;
  subdivisionId?: string;
  activeTab?: string;
}

export function TableView({ 
  equipment, 
  onDelete, 
  divisionId, 
  subdivisionId, 
  activeTab 
}: TableViewProps) {
  const navigate = useNavigate();

  // Функция для сортировки техники внутри групп
  const sortEquipmentInGroup = (equipmentList: Equipment[]): Equipment[] => {
    return [...equipmentList].sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
  };

  // Функция для форматирования даты
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return format(date, 'dd.MM.yyyy');
    } catch (error) {
      return '-';
    }
  };

  // Функция для форматирования имени сотрудника
  const formatEmployeeName = (employee: { full_name: string }) => {
    if (!employee?.full_name) return '-';
    const parts = employee.full_name.split(' ');
    if (parts.length < 3) return employee.full_name;

    const lastName = parts[0];
    const firstNameInitial = parts[1] ? `${parts[1][0]}.` : '';
    const middleNameInitial = parts[2] ? `${parts[2][0]}.` : '';

    return `${lastName} ${firstNameInitial}${middleNameInitial}`;
  };

  // Функция для форматирования поля "В чьих интересах"
  const formatInterestOrgan = (interestOrgan: any): string => {
    if (!interestOrgan) return '-';
    
    if (typeof interestOrgan === 'object' && interestOrgan.name) {
      return interestOrgan.name;
    }
    
    if (typeof interestOrgan === 'string') {
      return interestOrgan;
    }
    
    return '-';
  };

  // Группируем технику по подразделениям и отделениям
  const groupedData = equipment.reduce((acc, item) => {
    if (!item.division) {
      if (!acc.noDivision) {
        acc.noDivision = {
          groupName: 'Техника без подразделения',
          groupOrder: -1,
          equipment: []
        };
      }
      acc.noDivision.equipment.push(item);
    } else {
      const divisionId = item.division.id;
      const divisionName = item.division.name;
      const divisionOrder = item.division.order || 9999;
      
      const subdivisionId = item.subdivision?.id || 'no-subdivision';
      const subdivisionName = item.subdivision?.name || 'Без отделения';
      const subdivisionOrder = item.subdivision?.order || 9999;
      
      if (!acc.divisions[divisionId]) {
        acc.divisions[divisionId] = {
          divisionName,
          divisionOrder,
          subdivisions: {}
        };
      }
      
      if (!acc.divisions[divisionId].subdivisions[subdivisionId]) {
        acc.divisions[divisionId].subdivisions[subdivisionId] = {
          subdivisionName,
          subdivisionOrder,
          equipment: []
        };
      }
      
      acc.divisions[divisionId].subdivisions[subdivisionId].equipment.push(item);
    }
    
    return acc;
  }, {
    noDivision: null as { groupName: string; groupOrder: number; equipment: Equipment[] } | null,
    divisions: {} as Record<string, {
      divisionName: string;
      divisionOrder: number;
      subdivisions: Record<string, {
        subdivisionName: string;
        subdivisionOrder: number;
        equipment: Equipment[];
      }>;
    }>
  });

  // Сортируем технику внутри групп
  if (groupedData.noDivision) {
    groupedData.noDivision.equipment = sortEquipmentInGroup(groupedData.noDivision.equipment);
  }

  // Сортируем подразделения по order
  const sortedDivisionIds = Object.keys(groupedData.divisions).sort((a, b) => {
    return groupedData.divisions[a].divisionOrder - groupedData.divisions[b].divisionOrder;
  });

  // Для каждого подразделения сортируем отделения по order
  sortedDivisionIds.forEach(divisionId => {
    const division = groupedData.divisions[divisionId];
    const subdivisionIds = Object.keys(division.subdivisions);
    subdivisionIds.sort((a, b) => {
      return division.subdivisions[a].subdivisionOrder - division.subdivisions[b].subdivisionOrder;
    });
    
    division.sortedSubdivisionIds = subdivisionIds;
    
    subdivisionIds.forEach(subdivisionId => {
      division.subdivisions[subdivisionId].equipment = sortEquipmentInGroup(
        division.subdivisions[subdivisionId].equipment
      );
    });
  });

  const handleRowClick = (item: Equipment) => {
    navigate(`/equipment/${item.id}`, {
      state: {
        from: 'equipment-section',
        divisionId: divisionId,
        subdivisionId: subdivisionId,
        activeTab: activeTab
      }
    });
  };

  return (
    <div className="table-container">
      <table className="equipment-table">
        <thead className="table-header">
          <tr>
            <th className="table-header-cell">Название</th>
            <th className="table-header-cell">Модель</th>
            <th className="table-header-cell">Категория</th>
            <th className="table-header-cell">Статус</th>
            <th className="table-header-cell">Подразделение</th>
            <th className="table-header-cell">Серийный номер</th>
            <th className="table-header-cell">Инв. номер</th>
            <th className="table-header-cell">Дата производства</th>
            <th className="table-header-cell">Дата ввода в экспл.</th>
            <th className="table-header-cell">В чьих интересах</th>
            <th className="table-header-cell">Закреплено за</th>
            <th className="table-header-cell">Действия</th>
          </tr>
        </thead>
        <tbody className="table-body">
          {/* Сначала отображаем технику без подразделения */}
          {groupedData.noDivision && (
            <React.Fragment>
              <tr className="division-header-row no-division-header">
                <td colSpan={12} className="equipment-division-header-cell">
                  {groupedData.noDivision.groupName}
                </td>
              </tr>
              {groupedData.noDivision.equipment.map((item) => {
                const StatusIcon = getStatusIcon(item.status);
                return (
                  <tr
                    key={item.id}
                    onClick={() => handleRowClick(item)}
                    className="table-row no-division-row"
                  >
                    {/* Столбец Название с переносами строк */}
                    <td className="table-cell table-cell-name">
                      <div className="cell-content-full-width">
                        {item.name}
                      </div>
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
                      </div>
                    </td>
                    {/* Столбец Подразделение с блоками */}
                    <td className="table-cell">
                      <div className="division-container">
                        <div className="division-name">
                          {item.division?.name || '-'}
                        </div>
                        {item.subdivision?.name && (
                          <div className="subdivision-name">
                            {item.subdivision.name}
                          </div>
                        )}
                      </div>
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
                    <td className="table-cell">
                      <div className="cell-content">{formatInterestOrgan(item.interest_organ)}</div>
                    </td>
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
            </React.Fragment>
          )}

          {/* Затем отображаем подразделения с отделениями */}
          {sortedDivisionIds.map(divisionId => {
            const division = groupedData.divisions[divisionId];
            
            return (
              <React.Fragment key={divisionId}>
                {/* Заголовок подразделения */}
                <tr className="division-header-row">
                  <td colSpan={12} className="equipment-division-header-cell">
                    {division.divisionName}
                  </td>
                </tr>
                
                {/* Отделения внутри подразделения */}
                {division.sortedSubdivisionIds.map(subdivisionId => {
                  const subdivision = division.subdivisions[subdivisionId];
                  
                  return (
                    <React.Fragment key={subdivisionId}>
                      {/* Заголовок отделения (если есть техника) */}
                      {subdivision.equipment.length > 0 && (
                        <tr className="subdivision-header-row">
                          <td colSpan={12} className="equipment-subdivision-header-cell">
                            {subdivision.subdivisionName}
                          </td>
                        </tr>
                      )}
                      
                      {/* Техника отделения */}
                      {subdivision.equipment.map((item) => {
                        const StatusIcon = getStatusIcon(item.status);
                        return (
                          <tr
                            key={item.id}
                            onClick={() => handleRowClick(item)}
                            className="table-row"
                          >
                            {/* Столбец Название с переносами строк */}
                            <td className="table-cell table-cell-name">
                              <div className="cell-content-full-width">
                                {item.name}
                              </div>
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
                              </div>
                            </td>
                            {/* Столбец Подразделение с блоками */}
                            <td className="table-cell">
                              <div className="division-container">
                                <div className="division-name">
                                  {item.division?.name || '-'}
                                </div>
                                {item.subdivision?.name && (
                                  <div className="subdivision-name">
                                    {item.subdivision.name}
                                  </div>
                                )}
                              </div>
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
                            <td className="table-cell">
                              <div className="cell-content">{formatInterestOrgan(item.interest_organ)}</div>
                            </td>
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
                    </React.Fragment>
                  );
                })}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}