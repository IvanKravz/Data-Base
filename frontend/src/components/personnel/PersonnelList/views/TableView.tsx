// TableView.tsx
import React, { useState } from 'react';
import { Employee } from '../../../../types';
import { Trash2, Shield, ClipboardList, CircleUserRound, ChevronDown, ChevronRight } from 'lucide-react';
import './style.css';

interface TableViewProps {
  personnel: Employee[];
  onPersonClick: (person: Employee) => void;
  onDelete: (id: string) => void;
  divisionName: string;
  hasEditPermission: boolean;
}

export function TableView({ personnel, onPersonClick, onDelete, divisionName, hasEditPermission }: TableViewProps) {
  const [collapsedDivisions, setCollapsedDivisions] = useState<Set<string>>(new Set());
  const [collapsedSubdivisions, setCollapsedSubdivisions] = useState<Set<string>>(new Set());

  const toggleDivision = (divisionId: string) => {
    const newCollapsed = new Set(collapsedDivisions);
    newCollapsed.has(divisionId) ? newCollapsed.delete(divisionId) : newCollapsed.add(divisionId);
    setCollapsedDivisions(newCollapsed);
  };

  const toggleSubdivision = (divisionId: string, subdivisionId: string) => {
    const key = `${divisionId}-${subdivisionId}`;
    const newCollapsed = new Set(collapsedSubdivisions);
    newCollapsed.has(key) ? newCollapsed.delete(key) : newCollapsed.add(key);
    setCollapsedSubdivisions(newCollapsed);
  };

  // Маппинг подкатегорий для правильной сортировки
  const subcategoryOrder: Record<string, number> = {
    chief: 1,
    deputy_chief: 2,
    department_head: 3,
    deputy_department_head: 4,
    section_head: 5,
  };

  const sortEmployeesInGroup = (employees: Employee[]): Employee[] => {
    return [...employees].sort((a, b) => {
      // Сначала сравниваем категории (management всегда выше)
      if (a.category === 'management' && b.category !== 'management') return -1;
      if (a.category !== 'management' && b.category === 'management') return 1;

      // Если оба management, сортируем по подкатегории (если есть)
      if (a.category === 'management' && b.category === 'management') {
        const orderA = a.subcategory ? subcategoryOrder[a.subcategory] : 99;
        const orderB = b.subcategory ? subcategoryOrder[b.subcategory] : 99;
        if (orderA !== orderB) return orderA - orderB;
      }

      // Затем по приоритету
      if (a.priority !== b.priority) return a.priority - b.priority;
      // И по ФИО
      return a.full_name.localeCompare(b.full_name);
    });
  };

  // Группировка с разделением глобального руководства (без division) и локального
  const groupedData = personnel.reduce(
    (acc, person) => {
      const isManagement = person.category === 'management';
      const hasDivision = !!person.division;

      // Глобальное руководство (без подразделения)
      if (isManagement && !hasDivision) {
        if (!acc.globalManagement) acc.globalManagement = { employees: [] };
        acc.globalManagement.employees.push(person);
        return acc;
      }

      // Если нет подразделения, пропускаем
      if (!hasDivision) return acc;

      const divisionId = person.division.id;
      const divisionName = person.division.name;
      const divisionOrder = person.division.order || 9999;

      if (!acc.divisions[divisionId]) {
        acc.divisions[divisionId] = {
          divisionName,
          divisionOrder,
          managers: [],
          subdivisions: {},
        };
      }

      const divisionEntry = acc.divisions[divisionId];

      // Руководство отдела (management без отделения)
      if (isManagement && !person.subdivision) {
        divisionEntry.managers.push(person);
        return acc;
      }

      // Остальные сотрудники (в т.ч. руководство отделений)
      const subdivisionId = person.subdivision?.id || 'no-subdivision';
      const subdivisionName = person.subdivision?.name || 'Без отделения';
      const subdivisionOrder = person.subdivision?.order || 9999;

      if (!divisionEntry.subdivisions[subdivisionId]) {
        divisionEntry.subdivisions[subdivisionId] = {
          subdivisionName,
          subdivisionOrder,
          employees: [],
        };
      }
      divisionEntry.subdivisions[subdivisionId].employees.push(person);
      return acc;
    },
    {
      globalManagement: null as { employees: Employee[] } | null,
      divisions: {} as Record<
        string,
        {
          divisionName: string;
          divisionOrder: number;
          managers: Employee[];
          subdivisions: Record<
            string,
            {
              subdivisionName: string;
              subdivisionOrder: number;
              employees: Employee[];
            }
          >;
          sortedSubdivisionIds?: string[];
        }
      >,
    }
  );

  // Сортировка глобального руководства
  if (groupedData.globalManagement) {
    groupedData.globalManagement.employees = sortEmployeesInGroup(groupedData.globalManagement.employees);
  }

  // Сортировка подразделений
  const sortedDivisionIds = Object.keys(groupedData.divisions).sort(
    (a, b) => groupedData.divisions[a].divisionOrder - groupedData.divisions[b].divisionOrder
  );

  sortedDivisionIds.forEach((divisionId) => {
    const division = groupedData.divisions[divisionId];
    // Сортируем руководство отдела
    division.managers = sortEmployeesInGroup(division.managers);
    // Сортируем отделения
    const subdivisionIds = Object.keys(division.subdivisions);
    subdivisionIds.sort((a, b) => division.subdivisions[a].subdivisionOrder - division.subdivisions[b].subdivisionOrder);
    division.sortedSubdivisionIds = subdivisionIds;
    subdivisionIds.forEach((subId) => {
      division.subdivisions[subId].employees = sortEmployeesInGroup(division.subdivisions[subId].employees);
    });
  });

  const colSpan = hasEditPermission ? 7 : 6;

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
            {hasEditPermission && <th className="table-header-cell text-right">Действия</th>}
          </tr>
        </thead>
        <tbody className="table-body">
          {/* Глобальное руководство */}
          {groupedData.globalManagement && groupedData.globalManagement.employees.length > 0 && (
            <>
              <tr className="division-header-row management-header">
                <td colSpan={colSpan} className="personnel-division-header-cell">
                  Руководство (главный руководитель и заместители)
                </td>
              </tr>
              {groupedData.globalManagement.employees.map((person) => (
                <tr key={person.id} onClick={() => onPersonClick(person)} className="table-row management-row">
                  <td className="table-cell">{renderPersonCell(person)}</td>
                  <td className="table-cell">{person.rank || '—'}</td>
                  <td className="table-cell">{truncate(person.position, 30)}</td>
                  <td className="table-cell">{person.division?.name || '—'}</td>
                  <td className="table-cell">{renderPhones(person)}</td>
                  <td className="table-cell">{renderShaInfo(person)}</td>
                  {hasEditPermission && <td className="table-cell text-right">{renderDeleteButton(person.id)}</td>}
                </tr>
              ))}
            </>
          )}

          {/* Подразделения */}
          {sortedDivisionIds.map((divisionId) => {
            const division = groupedData.divisions[divisionId];
            const isDivisionCollapsed = collapsedDivisions.has(divisionId);
            const hasManagers = division.managers.length > 0;
            const hasSubdivisions = Object.keys(division.subdivisions).length > 0;

            return (
              <React.Fragment key={divisionId}>
                {/* Заголовок подразделения */}
                <tr className="division-header-row">
                  <td colSpan={colSpan} className="personnel-division-header-cell">
                    <div className="division-header-content">
                      <button className="collapse-button" onClick={() => toggleDivision(divisionId)}>
                        {isDivisionCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                      </button>
                      <span>{division.divisionName}</span>
                    </div>
                  </td>
                </tr>

                {!isDivisionCollapsed && (
                  <>
                    {/* Руководство отдела */}
                    {hasManagers && (
                      <>
                        <tr className="subdivision-header-row">
                          <td colSpan={colSpan} className="personnel-subdivision-header-cell">
                            Руководство отдела
                          </td>
                        </tr>
                        {division.managers.map((person) => (
                          <tr
                            key={person.id}
                            onClick={() => onPersonClick(person)}
                            className="table-row management-row"
                          >
                            <td className="table-cell">{renderPersonCell(person)}</td>
                            <td className="table-cell">{person.rank || '—'}</td>
                            <td className="table-cell">{truncate(person.position, 30)}</td>
                            <td className="table-cell">{person.division?.name || '—'}</td>
                            <td className="table-cell">{renderPhones(person)}</td>
                            <td className="table-cell">{renderShaInfo(person)}</td>
                            {hasEditPermission && <td className="table-cell text-right">{renderDeleteButton(person.id)}</td>}
                          </tr>
                        ))}
                      </>
                    )}

                    {/* Отделения */}
                    {division.sortedSubdivisionIds?.map((subdivisionId) => {
                      const subdivision = division.subdivisions[subdivisionId];
                      const subKey = `${divisionId}-${subdivisionId}`;
                      const isSubCollapsed = collapsedSubdivisions.has(subKey);
                      const hasEmployees = subdivision.employees.length > 0;
                      return (
                        <React.Fragment key={subdivisionId}>
                          {hasEmployees && (
                            <tr className="subdivision-header-row">
                              <td colSpan={colSpan} className="personnel-subdivision-header-cell">
                                <div className="subdivision-header-content">
                                  <button
                                    className="collapse-button"
                                    onClick={() => toggleSubdivision(divisionId, subdivisionId)}
                                  >
                                    {isSubCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                                  </button>
                                  <span>{subdivision.subdivisionName}</span>
                                </div>
                              </td>
                            </tr>
                          )}
                          {!isSubCollapsed &&
                            subdivision.employees.map((person) => (
                              <tr
                                key={person.id}
                                onClick={() => onPersonClick(person)}
                                className={`table-row ${person.category === 'management' ? 'management-row' : ''}`}
                              >
                                <td className="table-cell">{renderPersonCell(person)}</td>
                                <td className="table-cell">{person.rank || '—'}</td>
                                <td className="table-cell">{truncate(person.position, 30)}</td>
                                <td className="table-cell">{person.division?.name || '—'}</td>
                                <td className="table-cell">{renderPhones(person)}</td>
                                <td className="table-cell">{renderShaInfo(person)}</td>
                                {hasEditPermission && <td className="table-cell text-right">{renderDeleteButton(person.id)}</td>}
                              </tr>
                            ))}
                        </React.Fragment>
                      );
                    })}
                  </>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  // Вспомогательные функции рендеринга
  function renderPersonCell(person: Employee) {
    return (
      <div className="flex items-center">
        <div className="user-avatar">
          <span>{person.full_name.charAt(0)}</span>
        </div>
        <div className="ml-3">
          <div className="person-name">{truncate(person.full_name, 30)}</div>
          <div className="flex items-center gap-1 mt-0.5">
            {person.category === 'management' && (
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
    );
  }

  function renderPhones(person: Employee) {
    return (
      <div className="text-sm text-gray-900">
        <div>раб. {person.work_phone || '—'}</div>
        <div>сот. {person.personal_phone || '—'}</div>
      </div>
    );
  }

  function renderShaInfo(person: Employee) {
    return (
      <div className="text-sm text-gray-900">
        {person.sha_details && `${person.sha_details.access_level} класс / `}
        {person.form_state_secrets || '—'}
      </div>
    );
  }

  function renderDeleteButton(id: string) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(id);
        }}
        className="delete-button"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    );
  }

  function truncate(str: string, maxLen: number) {
    if (!str) return '';
    return str.length > maxLen ? `${str.substring(0, maxLen)}...` : str;
  }
}