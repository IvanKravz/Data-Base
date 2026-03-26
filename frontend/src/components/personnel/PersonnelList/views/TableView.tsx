// TableView.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Employee } from '../../../../types';
import { Trash2, Shield, ClipboardList, CircleUserRound, ChevronDown, ChevronRight } from 'lucide-react';
import './style.css';

interface TableViewProps {
  personnel: Employee[];
  onPersonClick: (person: Employee) => void; 
  onDelete: (id: string) => void;
  divisionName: string;
  hasEditPermission: boolean; // получаем из родителя
}

export function TableView({ personnel, onPersonClick, onDelete, divisionName, hasEditPermission }: TableViewProps) {
  
  // Состояния для отслеживания свернутых/развернутых разделов
  const [collapsedDivisions, setCollapsedDivisions] = useState<Set<string>>(new Set());
  const [collapsedSubdivisions, setCollapsedSubdivisions] = useState<Set<string>>(new Set());

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

  // Функция для сортировки сотрудников внутри групп
  const sortEmployeesInGroup = (employees: Employee[]): Employee[] => {
    return [...employees].sort((a, b) => {
      // Руководство всегда первое
      if (a.category === 'management' && b.category !== 'management') return -1;
      if (a.category !== 'management' && b.category === 'management') return 1;
      
      // Затем сортируем по приоритету и ФИО
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return a.full_name.localeCompare(b.full_name);
    });
  };

  // Группируем сотрудников по подразделениям и отделениям
  const groupedData = personnel.reduce((acc, person) => {
    const isManagement = person.category === 'management';
    
    if (isManagement) {
      if (!acc.management) {
        acc.management = {
          groupName: 'Руководство',
          groupOrder: -1,
          employees: []
        };
      }
      acc.management.employees.push(person);
    } else {
      if (!person.division) {
        return acc;
      }
      
      const divisionId = person.division.id;
      const divisionName = person.division.name;
      const divisionOrder = person.division.order || 9999;
      
      const subdivisionId = person.subdivision?.id || 'no-subdivision';
      const subdivisionName = person.subdivision?.name || 'Без отделения';
      const subdivisionOrder = person.subdivision?.order || 9999;
      
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
          employees: []
        };
      }
      
      acc.divisions[divisionId].subdivisions[subdivisionId].employees.push(person);
    }
    
    return acc;
  }, {
    management: null as { groupName: string; groupOrder: number; employees: Employee[] } | null,
    divisions: {} as Record<string, {
      divisionName: string;
      divisionOrder: number;
      subdivisions: Record<string, {
        subdivisionName: string;
        subdivisionOrder: number;
        employees: Employee[];
      }>;
      sortedSubdivisionIds?: string[];
    }>
  });

  if (groupedData.management) {
    groupedData.management.employees = sortEmployeesInGroup(groupedData.management.employees);
  }

  const sortedDivisionIds = Object.keys(groupedData.divisions).sort((a, b) => {
    return groupedData.divisions[a].divisionOrder - groupedData.divisions[b].divisionOrder;
  });

  sortedDivisionIds.forEach(divisionId => {
    const division = groupedData.divisions[divisionId];
    const subdivisionIds = Object.keys(division.subdivisions);
    subdivisionIds.sort((a, b) => {
      return division.subdivisions[a].subdivisionOrder - division.subdivisions[b].subdivisionOrder;
    });
    division.sortedSubdivisionIds = subdivisionIds;
    
    subdivisionIds.forEach(subdivisionId => {
      division.subdivisions[subdivisionId].employees = sortEmployeesInGroup(
        division.subdivisions[subdivisionId].employees
      );
    });
  });

  return (
    <div className="table-container">
      <table className="table">
        <thead className="table-header">
          <tr>
            <th className="table-header-cell">Фамилия, имя, отчество</th>
            <th className="table-header-cell">Звание</th>
            <th className="table-header-cell">Должность</th>
            <th className="table-header-cell">Подразделение</th>
            <th className="table-header-cell">Телефон</th>
            <th className="table-header-cell">Класс сети/ Форма ГТ</th>
            {hasEditPermission && (
              <th className="table-header-cell text-right">Действия</th>
            )}
          </tr>
        </thead>
        <tbody className="table-body">
          {/* Руководство */}
          {groupedData.management && groupedData.management.employees.length > 0 && (
            <React.Fragment>
              <tr className="division-header-row management-header">
                <td colSpan={hasEditPermission ? 7 : 6} className="personnel-division-header-cell">
                  {groupedData.management.groupName}
                </td>
              </tr>
              {groupedData.management.employees.map((person) => (
                <tr
                  key={person.id}
                  onClick={() => onPersonClick(person)}
                  className="table-row management-row"
                >
                  <td className="table-cell">
                    <div className="flex items-center">
                      <div className="user-avatar">
                        <span>{person.full_name.charAt(0)}</span>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {person.full_name.length > 30
                            ? `${person.full_name.substring(0, 30)}...`
                            : person.full_name}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {person.category === "management" && (
                            <div className="badge badge--red">
                              <CircleUserRound className="h-4 w-4" />
                              <span>Руководство</span>
                            </div>
                          )}
                          {person.is_material_responsible && (
                            <div className="badge badge--blue">
                              <ClipboardList className="h-3 w-3" />
                              <span>МОЛ</span>
                            </div>
                          )}
                          {person.is_sha_worker && (
                            <div className="badge badge--green">
                              <Shield className="h-3 w-3" />
                              <span>ШР</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="text-sm text-gray-900">{person.rank || '—'}</div>
                  </td>
                  <td className="table-cell">
                    <div className="text-sm text-gray-900">
                      {person.position.length > 30
                        ? `${person.position.substring(0, 30)}...`
                        : person.position}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="text-sm text-gray-900">{person.division?.name || '—'}</div>
                    <div className="text-xs text-gray-500">{person.subdivision?.name || ''}</div>
                  </td>
                  <td className="table-cell">
                    <div className="text-sm text-gray-900">
                      <div>раб. {person.work_phone || '—'}</div>
                      <div>сот. {person.personal_phone || '—'}</div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="text-sm text-gray-900">
                      {person.sha_details && `${person.sha_details.access_level} класс / `}
                      {person.form_state_secrets || '—'}
                    </div>
                  </td>
                  {hasEditPermission && (
                    <td className="table-cell text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(person.id);
                        }}
                        className="delete-button"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </React.Fragment>
          )}

          {/* Подразделения с отделениями */}
          {sortedDivisionIds.map(divisionId => {
            const division = groupedData.divisions[divisionId];
            const isDivisionCollapsed = collapsedDivisions.has(divisionId);
            
            return (
              <React.Fragment key={divisionId}>
                <tr className="division-header-row">
                  <td colSpan={hasEditPermission ? 7 : 6} className="personnel-division-header-cell">
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
                
                {!isDivisionCollapsed && division.sortedSubdivisionIds.map(subdivisionId => {
                  const subdivision = division.subdivisions[subdivisionId];
                  const subdivisionKey = `${divisionId}-${subdivisionId}`;
                  const isSubdivisionCollapsed = collapsedSubdivisions.has(subdivisionKey);
                  
                  return (
                    <React.Fragment key={subdivisionId}>
                      {subdivision.employees.length > 0 && (
                        <tr className="subdivision-header-row">
                          <td colSpan={hasEditPermission ? 7 : 6} className="personnel-subdivision-header-cell">
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
                      
                      {!isSubdivisionCollapsed && subdivision.employees.map((person) => (
                        <tr
                          key={person.id}
                          onClick={() => onPersonClick(person)}
                          className="table-row"
                        >
                          <td className="table-cell">
                            <div className="flex items-center">
                              <div className="user-avatar">
                                <span>{person.full_name.charAt(0)}</span>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {person.full_name.length > 30
                                    ? `${person.full_name.substring(0, 30)}...`
                                    : person.full_name}
                                </div>
                                <div className="flex items-center gap-1 mt-0.5">
                                  {person.category === "management" && (
                                    <div className="badge badge--red">
                                      <CircleUserRound className="h-4 w-4" />
                                      <span>Руководство</span>
                                    </div>
                                  )}
                                  {person.is_material_responsible && (
                                    <div className="badge badge--blue">
                                      <ClipboardList className="h-3 w-3" />
                                      <span>МОЛ</span>
                                    </div>
                                  )}
                                  {person.is_sha_worker && (
                                    <div className="badge badge--green">
                                      <Shield className="h-3 w-3" />
                                      <span>ШР</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="table-cell">
                            <div className="text-sm text-gray-900">{person.rank || '—'}</div>
                          </td>
                          <td className="table-cell">
                            <div className="text-sm text-gray-900">
                              {person.position.length > 30
                                ? `${person.position.substring(0, 30)}...`
                                : person.position}
                            </div>
                          </td>
                          <td className="table-cell">
                            <div className="text-sm text-gray-900">{person.division?.name || '—'}</div>
                            <div className="text-xs text-gray-500">{person.subdivision?.name || ''}</div>
                          </td>
                          <td className="table-cell">
                            <div className="text-sm text-gray-900">
                              <div>раб. {person.work_phone || '—'}</div>
                              <div>сот. {person.personal_phone || '—'}</div>
                            </div>
                          </td>
                          <td className="table-cell">
                            <div className="text-sm text-gray-900">
                              {person.sha_details && `${person.sha_details.access_level} класс / `}
                              {person.form_state_secrets || '—'}
                            </div>
                          </td>
                          {hasEditPermission && (
                            <td className="table-cell text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDelete(person.id);
                                }}
                                className="delete-button"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
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