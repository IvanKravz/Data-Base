// TableView.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Equipment } from '../../../../types';
import { Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { getStatusIcon, getStatusColor } from '../../../../utils/statusUtils';
import { format } from 'date-fns';
import { canEdit, canDelete } from '../../../../api/utils/permissions';
import './style.css';

interface TableViewProps {
  equipment: Equipment[];
  onDelete: (id: string) => void;
  divisionId?: string;
  subdivisionId?: string;
  activeTab?: string;
  disableRowClick?: boolean;
  showActions?: boolean;
}

export function TableView({
  equipment,
  onDelete,
  divisionId,
  subdivisionId,
  activeTab,
  disableRowClick = false,
  showActions = true
}: TableViewProps & { disableRowClick?: boolean }) {
  const navigate = useNavigate();

  // Состояния для отслеживания свернутых/развернутых разделов
  const [collapsedDivisions, setCollapsedDivisions] = useState<Set<string>>(new Set());
  const [collapsedSubdivisions, setCollapsedSubdivisions] = useState<Set<string>>(new Set());
  
  console.log('equipment', equipment)
  
  // Проверяем права на редактирование и удаление оборудования
  const hasEditPermission = canEdit('equipment');
  const hasDeletePermission = canDelete('equipment');
  console.log('hasDeletePermission', hasDeletePermission)
  
  // Столбец действий отображается только если:
  // 1. showActions=true 
  // 2. Есть права на редактирование
  // 3. Есть права на удаление
  const shouldShowActions = showActions && hasEditPermission && hasDeletePermission;

  // Функция для переключения состояния подразделения
  const toggleDivision = (divisionId: string) => {
    const newCollapsed = new Set(collapsedDivisions);
    if (newCollapsed.has(divisionId)) {
      newCollapsed.delete(divisionId);
    } else {
      newCollapsed.add(divisionId);
    }
    setCollapsedDivisions(newCollapsed);
  };

  // Функция для переключения состояния отделения
  const toggleSubdivision = (divisionId: string, subdivisionId: string) => {
    const key = `${divisionId}-${subdivisionId}`;
    const newCollapsed = new Set(collapsedSubdivisions);
    if (newCollapsed.has(key)) {
      newCollapsed.delete(key);
    } else {
      newCollapsed.add(key);
    }
    setCollapsedSubdivisions(newCollapsed);
  };

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
    // Если disableRowClick true, не выполняем навигацию
    if (disableRowClick) return;

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
            <th className="table-header-cell-equipment">Название</th>
            <th className="table-header-cell-equipment">Модель</th>
            <th className="table-header-cell-equipment">Категория</th>
            <th className="table-header-cell-equipment">Статус</th>
            <th className="table-header-cell-equipment">Подразделение</th>
            <th className="table-header-cell-equipment">Серийный номер</th>
            <th className="table-header-cell-equipment">Инв. номер</th>
            <th className="table-header-cell-equipment">Дата производства</th>
            <th className="table-header-cell-equipment">Дата ввода в экспл.</th>
            <th className="table-header-cell-equipment">В чьих интересах</th>
            <th className="table-header-cell-equipment">Закреплено за</th>
            {/* Условно отображаем заголовок Действия */}
            {shouldShowActions && <th className="table-header-cell-equipment">Действия</th>}
          </tr>
        </thead>
        <tbody className="table-body">
          {/* Сначала отображаем технику без подразделения */}
          {groupedData.noDivision && (
            <React.Fragment>
              <tr className="division-header-row no-division-header">
                <td colSpan={shouldShowActions ? 12 : 11} className="equipment-division-header-cell">
                  {groupedData.noDivision.groupName}
                </td>
              </tr>
              {groupedData.noDivision.equipment.map((item) => {
                const StatusIcon = getStatusIcon(item.status);
                return (
                  <tr
                    key={item.id}
                    onClick={() => handleRowClick(item)}
                    className="table-row-equipment no-division-row"
                    style={disableRowClick ? { cursor: 'default' } : { cursor: 'pointer' }}
                  >
                    {/* Столбец Название с переносами строк */}
                    <td className="table-cell-equipment table-cell-name">
                      <div className="cell-content-full-width">
                        {item.name}
                      </div>
                    </td>
                    <td className="table-cell-equipment">
                      <div className="cell-content">{item.type}</div>
                    </td>
                    <td className="table-cell-equipment">
                      <div className="cell-content">{item.category_display}</div>
                    </td>
                    <td className="table-cell-equipment">
                      <div className={`cell-content ${getStatusColor(item.status)}`}>
                        <StatusIcon className="status-icon" />
                      </div>
                    </td>
                    {/* Столбец Подразделение с блоками */}
                    <td className="table-cell-equipment">
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
                    <td className="table-cell-equipment">
                      <div className="cell-content">{item.serial_number}</div>
                    </td>
                    <td className="table-cell-equipment">
                      <div className="cell-content">{item.inventory_number}</div>
                    </td>
                    <td className="table-cell-equipment">
                      <div className="cell-content">{formatDate(item.manufacturing_date)}</div>
                    </td>
                    <td className="table-cell-equipment">
                      <div className="cell-content">{formatDate(item.exploitation_date)}</div>
                    </td>
                    <td className="table-cell-equipment">
                      <div className="cell-content">{formatInterestOrgan(item.interest_organ)}</div>
                    </td>
                    <td className="table-cell-equipment table-cell-assigned-to">
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
                    {/* Условно отображаем ячейку с действиями */}
                    {shouldShowActions && (
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
                    )}
                  </tr>
                );
              })}
            </React.Fragment>
          )}

          {/* Затем отображаем подразделения с отделениями */}
          {sortedDivisionIds.map(divisionId => {
            const division = groupedData.divisions[divisionId];
            const isDivisionCollapsed = collapsedDivisions.has(divisionId);

            return (
              <React.Fragment key={divisionId}>
                {/* Заголовок подразделения */}
                <tr className="division-header-row">
                  <td colSpan={shouldShowActions ? 12 : 11} className="equipment-division-header-cell">
                    <div className="division-header-content">
                      <button 
                        className="collapse-button"
                        onClick={() => toggleDivision(divisionId)}
                      >
                        {isDivisionCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                      </button>
                      <span>{division.divisionName}</span>
                    </div>
                  </td>
                </tr>

                {/* Отделения внутри подразделения (показываем только если подразделение не свернуто) */}
                {!isDivisionCollapsed && division.sortedSubdivisionIds.map(subdivisionId => {
                  const subdivision = division.subdivisions[subdivisionId];
                  const subdivisionKey = `${divisionId}-${subdivisionId}`;
                  const isSubdivisionCollapsed = collapsedSubdivisions.has(subdivisionKey);

                  return (
                    <React.Fragment key={subdivisionId}>
                      {/* Заголовок отделения (если есть техника) */}
                      {subdivision.equipment.length > 0 && (
                        <tr className="subdivision-header-row">
                          <td colSpan={shouldShowActions ? 12 : 11} className="equipment-subdivision-header-cell">
                            <div className="subdivision-header-content">
                              <button 
                                className="collapse-button"
                                onClick={() => toggleSubdivision(divisionId, subdivisionId)}
                              >
                                {isSubdivisionCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                              </button>
                              <span>{subdivision.subdivisionName}</span>
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* Техника отделения (показываем только если отделение не свернуто) */}
                      {!isSubdivisionCollapsed && subdivision.equipment.map((item) => {
                        const StatusIcon = getStatusIcon(item.status);
                        return (
                          <tr
                            key={item.id}
                            onClick={() => handleRowClick(item)}
                            className="table-row-equipment"
                            style={disableRowClick ? { cursor: 'default' } : { cursor: 'pointer' }}
                          >
                            {/* Столбец Название с переносами строк */}
                            <td className="table-cell-equipment table-cell-name">
                              <div className="cell-content-full-width">
                                {item.name}
                              </div>
                            </td>
                            <td className="table-cell-equipment">
                              <div className="cell-content">{item.type}</div>
                            </td>
                            <td className="table-cell-equipment">
                              <div className="cell-content">{item.category_display}</div>
                            </td>
                            <td className="table-cell-equipment">
                              <div className={`cell-content ${getStatusColor(item.status)}`}>
                                <StatusIcon className="status-icon" />
                              </div>
                            </td>
                            {/* Столбец Подразделение с блоками */}
                            <td className="table-cell-equipment">
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
                            <td className="table-cell-equipment">
                              <div className="cell-content">{item.serial_number}</div>
                            </td>
                            <td className="table-cell-equipment">
                              <div className="cell-content">{item.inventory_number}</div>
                            </td>
                            <td className="table-cell-equipment">
                              <div className="cell-content">{formatDate(item.manufacturing_date)}</div>
                            </td>
                            <td className="table-cell-equipment">
                              <div className="cell-content">{formatDate(item.exploitation_date)}</div>
                            </td>
                            <td className="table-cell-equipment">
                              <div className="cell-content">{formatInterestOrgan(item.interest_organ)}</div>
                            </td>
                            <td className="table-cell-equipment table-cell-assigned-to">
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
                            {/* Условно отображаем ячейку с действиями */}
                            {shouldShowActions && (
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
                            )}
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