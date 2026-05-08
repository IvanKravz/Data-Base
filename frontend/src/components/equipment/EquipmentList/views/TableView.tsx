// TableView.tsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import { Equipment } from '../../../../types';
import { Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { getStatusIcon, getStatusColor } from '../../../../utils/statusUtils';
import { format } from 'date-fns';
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
  showActions = true,
}: TableViewProps) {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const permissions = user?.permissions;

  const hasEditPermission = useMemo(
    () => permissions?.models?.Equipment?.includes('change') ?? false,
    [permissions]
  );
  const hasDeletePermission = useMemo(
    () => permissions?.models?.Equipment?.includes('delete') ?? false,
    [permissions]
  );

  const shouldShowActions = showActions && hasEditPermission && hasDeletePermission;

  const [collapsedDivisions, setCollapsedDivisions] = useState<Set<string>>(new Set());
  const [collapsedSubdivisions, setCollapsedSubdivisions] = useState<Set<string>>(new Set());
  const [collapsedNoDivision, setCollapsedNoDivision] = useState<boolean>(false);

  const sortEquipmentInGroup = (equipmentList: Equipment[]): Equipment[] => {
    return [...equipmentList].sort((a, b) => a.name.localeCompare(b.name));
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return format(date, 'dd.MM.yyyy');
    } catch {
      return '-';
    }
  };

  const formatEmployeeName = (employee: { full_name: string }) => {
    if (!employee?.full_name) return '-';
    const parts = employee.full_name.split(' ');
    if (parts.length < 3) return employee.full_name;
    const lastName = parts[0];
    const firstNameInitial = parts[1] ? `${parts[1][0]}.` : '';
    const middleNameInitial = parts[2] ? `${parts[2][0]}.` : '';
    return `${lastName} ${firstNameInitial}${middleNameInitial}`;
  };

  const formatInterestOrgan = (interestOrgan: any): string => {
    if (!interestOrgan) return '-';
    if (typeof interestOrgan === 'object' && interestOrgan.name) return interestOrgan.name;
    if (typeof interestOrgan === 'string') return interestOrgan;
    return '-';
  };

  const groupedData = equipment.reduce(
    (acc, item) => {
      if (!item.division) {
        if (!acc.noDivision) {
          acc.noDivision = { groupName: 'Техника без подразделения', groupOrder: -1, equipment: [] };
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
          acc.divisions[divisionId] = { divisionName, divisionOrder, subdivisions: {} };
        }
        if (!acc.divisions[divisionId].subdivisions[subdivisionId]) {
          acc.divisions[divisionId].subdivisions[subdivisionId] = {
            subdivisionName,
            subdivisionOrder,
            equipment: [],
          };
        }
        acc.divisions[divisionId].subdivisions[subdivisionId].equipment.push(item);
      }
      return acc;
    },
    {
      noDivision: null as { groupName: string; groupOrder: number; equipment: Equipment[] } | null,
      divisions: {} as Record<
        string,
        {
          divisionName: string;
          divisionOrder: number;
          subdivisions: Record<
            string,
            { subdivisionName: string; subdivisionOrder: number; equipment: Equipment[] }
          >;
          sortedSubdivisionIds?: string[];
        }
      >,
    }
  );

  if (groupedData.noDivision) {
    groupedData.noDivision.equipment = sortEquipmentInGroup(groupedData.noDivision.equipment);
  }

  const sortedDivisionIds = Object.keys(groupedData.divisions).sort(
    (a, b) => groupedData.divisions[a].divisionOrder - groupedData.divisions[b].divisionOrder
  );

  sortedDivisionIds.forEach((divisionId) => {
    const division = groupedData.divisions[divisionId];
    const subdivisionIds = Object.keys(division.subdivisions);
    subdivisionIds.sort(
      (a, b) => division.subdivisions[a].subdivisionOrder - division.subdivisions[b].subdivisionOrder
    );
    division.sortedSubdivisionIds = subdivisionIds;
    subdivisionIds.forEach((subId) => {
      division.subdivisions[subId].equipment = sortEquipmentInGroup(division.subdivisions[subId].equipment);
    });
  });

  const toggleDivision = (id: string) => {
    setCollapsedDivisions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const toggleSubdivision = (divisionId: string, subdivisionId: string) => {
    const key = `${divisionId}-${subdivisionId}`;
    setCollapsedSubdivisions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) newSet.delete(key);
      else newSet.add(key);
      return newSet;
    });
  };

  const toggleNoDivision = () => {
    setCollapsedNoDivision((prev) => !prev);
  };

  const handleRowClick = (item: Equipment) => {
    if (disableRowClick) return;
    navigate(`/equipment/${item.id}`, {
      state: { from: 'equipment-section', divisionId, subdivisionId, activeTab },
    });
  };

  const colSpan = shouldShowActions ? 12 : 11;

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
            {shouldShowActions && <th className="table-header-cell-equipment">Действия</th>}
          </tr>
        </thead>
        <tbody className="table-body">
          {/* Техника без подразделения */}
          {groupedData.noDivision && (
            <React.Fragment>
              <tr
                className="division-header-row no-division-header"
                onClick={toggleNoDivision}
                style={{ cursor: 'pointer' }}
              >
                <td colSpan={colSpan} className="equipment-division-header-cell">
                  <div className="division-header-content">
                    <button
                      className="collapse-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleNoDivision();
                      }}
                    >
                      {collapsedNoDivision ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                    </button>
                    <span>{groupedData.noDivision.groupName}</span>
                  </div>
                </td>
              </tr>
              {!collapsedNoDivision &&
                groupedData.noDivision.equipment.map((item) => {
                  const StatusIcon = getStatusIcon(item.status);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => handleRowClick(item)}
                      className="table-row-equipment no-division-row"
                      style={disableRowClick ? { cursor: 'default' } : { cursor: 'pointer' }}
                    >
                      <td className="table-cell-equipment table-cell-name">
                        <div className="cell-content-full-width">{item.name}</div>
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
                      <td className="table-cell-equipment">
                        <div className="division-container">
                          <div className="division-name">{item.division?.name || '-'}</div>
                          {item.subdivision?.name && (
                            <div className="subdivision-name">{item.subdivision.name}</div>
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
                                <span className="position-text">{item.assigned_to.position}</span>
                              )}
                            </>
                          ) : (
                            '-'
                          )}
                        </div>
                      </td>
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

          {/* Подразделения */}
          {sortedDivisionIds.map((divisionId) => {
            const division = groupedData.divisions[divisionId];
            const isDivisionCollapsed = collapsedDivisions.has(divisionId);
            return (
              <React.Fragment key={divisionId}>
                <tr
                  className="division-header-row"
                  onClick={() => toggleDivision(divisionId)}
                  style={{ cursor: 'pointer' }}
                >
                  <td colSpan={colSpan} className="equipment-division-header-cell">
                    <div className="division-header-content">
                      <button
                        className="collapse-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDivision(divisionId);
                        }}
                      >
                        {isDivisionCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                      </button>
                      <span>{division.divisionName}</span>
                    </div>
                  </td>
                </tr>
                {!isDivisionCollapsed &&
                  division.sortedSubdivisionIds!.map((subdivisionId) => {
                    const subdivision = division.subdivisions[subdivisionId];
                    const subdivisionKey = `${divisionId}-${subdivisionId}`;
                    const isSubdivisionCollapsed = collapsedSubdivisions.has(subdivisionKey);
                    const hasEquipment = subdivision.equipment.length > 0;
                    return (
                      <React.Fragment key={subdivisionId}>
                        {hasEquipment && (
                          <tr
                            className="subdivision-header-row"
                            onClick={() => toggleSubdivision(divisionId, subdivisionId)}
                            style={{ cursor: 'pointer' }}
                          >
                            <td colSpan={colSpan} className="equipment-subdivision-header-cell">
                              <div className="subdivision-header-content">
                                <button
                                  className="collapse-button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSubdivision(divisionId, subdivisionId);
                                  }}
                                >
                                  {isSubdivisionCollapsed ? (
                                    <ChevronRight size={16} />
                                  ) : (
                                    <ChevronDown size={16} />
                                  )}
                                </button>
                                <span>{subdivision.subdivisionName}</span>
                              </div>
                            </td>
                          </tr>
                        )}
                        {!isSubdivisionCollapsed &&
                          subdivision.equipment.map((item) => {
                            const StatusIcon = getStatusIcon(item.status);
                            return (
                              <tr
                                key={item.id}
                                onClick={() => handleRowClick(item)}
                                className="table-row-equipment"
                                style={disableRowClick ? { cursor: 'default' } : { cursor: 'pointer' }}
                              >
                                <td className="table-cell-equipment table-cell-name">
                                  <div className="cell-content-full-width">{item.name}</div>
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
                                <td className="table-cell-equipment">
                                  <div className="division-container">
                                    <div className="division-name">{item.division?.name || '-'}</div>
                                    {item.subdivision?.name && (
                                      <div className="subdivision-name">{item.subdivision.name}</div>
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
                                  <div className="cell-content">
                                    {formatInterestOrgan(item.interest_organ)}
                                  </div>
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