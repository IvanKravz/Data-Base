import React, { useState, useMemo, useLayoutEffect, useEffect } from 'react';
import { Employee } from '../../../../types';
import { Trash2, Shield, ClipboardList, CircleUserRound, ChevronDown, ChevronRight } from 'lucide-react';
import './style.css';

interface TableViewProps {
  personnel: Employee[];
  onPersonClick: (person: Employee) => void;
  onDelete: (id: string) => void;
  divisionName: string;
  hasEditPermission: boolean;
  viewMode: 'flat' | 'grouped';
  storageKey?: string;
  searchTerm?: string;
}

export function TableView({
  personnel,
  onPersonClick,
  onDelete,
  divisionName,
  hasEditPermission,
  viewMode,
  storageKey = 'default',
  searchTerm = ''
}: TableViewProps) {
  const [collapsedDivisions, setCollapsedDivisions] = useState<Set<string>>(new Set());
  const [collapsedSubdivisions, setCollapsedSubdivisions] = useState<Set<string>>(new Set());
  const [collapsedGlobalManagement, setCollapsedGlobalManagement] = useState<boolean>(true);
  const [collapsedDepartmentManagement, setCollapsedDepartmentManagement] = useState<Set<string>>(new Set());
  const [isInitialized, setIsInitialized] = useState(false);
  const [savedCollapsed, setSavedCollapsed] = useState<{
    collapsedDivisions: Set<string>;
    collapsedSubdivisions: Set<string>;
    collapsedGlobalManagement: boolean;
    collapsedDepartmentManagement: Set<string>;
  } | null>(null);

  const fullStorageKey = useMemo(
    () => `personnel_table_collapsed_${storageKey}_${viewMode}`,
    [storageKey, viewMode]
  );

  const subcategoryOrder: Record<string, number> = {
    chief: 1,
    deputy_chief: 2,
    department_head: 3,
    deputy_department_head: 4,
    section_head: 5,
  };

  const sortEmployeesInGroup = (employees: Employee[]): Employee[] => {
    return [...employees].sort((a, b) => {
      if (a.category === 'management' && b.category !== 'management') return -1;
      if (a.category !== 'management' && b.category === 'management') return 1;
      if (a.category === 'management' && b.category === 'management') {
        const orderA = a.subcategory ? subcategoryOrder[a.subcategory] : 99;
        const orderB = b.subcategory ? subcategoryOrder[b.subcategory] : 99;
        if (orderA !== orderB) return orderA - orderB;
      }
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.full_name.localeCompare(b.full_name);
    });
  };

  // Фильтруем сотрудников по поисковому запросу
  const filteredPersonnel = useMemo(() => {
    if (!searchTerm.trim()) return personnel;
    const lowerSearch = searchTerm.toLowerCase();
    return personnel.filter(p => p.full_name.toLowerCase().includes(lowerSearch));
  }, [personnel, searchTerm]);

  const groupedData = useMemo(() => {
    if (viewMode !== 'grouped') return null;
    const result = filteredPersonnel.reduce(
      (acc, person) => {
        const isManagement = person.category === 'management';
        const hasDivision = !!person.division;
        if (isManagement && !hasDivision) {
          if (!acc.globalManagement) acc.globalManagement = { employees: [] };
          acc.globalManagement.employees.push(person);
          return acc;
        }
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
        if (isManagement && !person.subdivision) {
          divisionEntry.managers.push(person);
          return acc;
        }
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
        divisions: {} as Record<string, any>,
      }
    );

    // Сортировка внутри групп
    if (result.globalManagement) {
      result.globalManagement.employees = sortEmployeesInGroup(result.globalManagement.employees);
    }
    const sortedDivisionIds = Object.keys(result.divisions).sort(
      (a, b) => result.divisions[a].divisionOrder - result.divisions[b].divisionOrder
    );
    sortedDivisionIds.forEach((divisionId) => {
      const division = result.divisions[divisionId];
      division.managers = sortEmployeesInGroup(division.managers);
      const subdivisionIds = Object.keys(division.subdivisions);
      subdivisionIds.sort(
        (a, b) => division.subdivisions[a].subdivisionOrder - division.subdivisions[b].subdivisionOrder
      );
      division.sortedSubdivisionIds = subdivisionIds;
      subdivisionIds.forEach((subId) => {
        division.subdivisions[subId].employees = sortEmployeesInGroup(division.subdivisions[subId].employees);
      });
    });

    return { globalManagement: result.globalManagement, divisions: result.divisions, sortedDivisionIds };
  }, [filteredPersonnel, viewMode]);

  const flatSortedData = useMemo(() => {
    if (viewMode !== 'flat') return [];
    // Для плоского режима тоже применяем фильтрацию
    const dataToUse = searchTerm.trim()
      ? personnel.filter(p => p.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
      : personnel;

    const globalManagement = dataToUse.filter(p => p.category === 'management' && !p.division);
    const sortedGlobal = sortEmployeesInGroup(globalManagement);

    const divisionsMap = new Map<string, any>();
    dataToUse.forEach(person => {
      if (!person.division) return;
      const divId = person.division.id;
      if (!divisionsMap.has(divId)) {
        divisionsMap.set(divId, {
          division: person.division,
          managers: [],
          subdivisions: new Map(),
        });
      }
      const divEntry = divisionsMap.get(divId)!;
      if (person.category === 'management' && !person.subdivision) {
        divEntry.managers.push(person);
      } else {
        const subId = person.subdivision?.id || 'no-subdivision';
        if (!divEntry.subdivisions.has(subId)) {
          divEntry.subdivisions.set(subId, {
            subdivision: person.subdivision || { id: 'no-subdivision', name: 'Без отделения', order: 9999 },
            employees: [],
          });
        }
        divEntry.subdivisions.get(subId)!.employees.push(person);
      }
    });

    const sortedDivisions = Array.from(divisionsMap.values()).sort(
      (a, b) => (a.division.order || 9999) - (b.division.order || 9999)
    );
    const result: Employee[] = [...sortedGlobal];
    for (const div of sortedDivisions) {
      result.push(...sortEmployeesInGroup(div.managers));
      const sortedSubs = Array.from(div.subdivisions.values()).sort(
        (a, b) => (a.subdivision.order || 9999) - (b.subdivision.order || 9999)
      );
      for (const sub of sortedSubs) {
        result.push(...sortEmployeesInGroup(sub.employees));
      }
    }
    return result;
  }, [personnel, viewMode, searchTerm]);

  // Инициализация состояний свёрнутости (только для grouped режима)
  useLayoutEffect(() => {
    if (viewMode !== 'grouped') return;
    if (isInitialized) return;
    if (!groupedData) return;

    const saved = sessionStorage.getItem(fullStorageKey);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (typeof data.collapsedGlobalManagement === 'boolean')
          setCollapsedGlobalManagement(data.collapsedGlobalManagement);
        if (Array.isArray(data.collapsedDepartmentManagement))
          setCollapsedDepartmentManagement(new Set(data.collapsedDepartmentManagement));
        if (Array.isArray(data.collapsedDivisions))
          setCollapsedDivisions(new Set(data.collapsedDivisions));
        if (Array.isArray(data.collapsedSubdivisions))
          setCollapsedSubdivisions(new Set(data.collapsedSubdivisions));
        setIsInitialized(true);
        return;
      } catch (e) { }
    }

    // Если нет сохранённых данных – закрываем всё
    const allDivisionIds = Object.keys(groupedData.divisions);
    const allSubdivisionKeys = new Set<string>();
    Object.entries(groupedData.divisions).forEach(([divId, div]: [string, any]) => {
      if (div.sortedSubdivisionIds) {
        div.sortedSubdivisionIds.forEach((subId: string) => {
          allSubdivisionKeys.add(`${divId}-${subId}`);
        });
      }
    });
    setCollapsedDivisions(new Set(allDivisionIds));
    setCollapsedSubdivisions(allSubdivisionKeys);
    setCollapsedDepartmentManagement(new Set(allDivisionIds));
    setCollapsedGlobalManagement(true);
    setIsInitialized(true);
  }, [groupedData, fullStorageKey, viewMode, isInitialized]);

  // Сохранение состояния свёрнутости в sessionStorage
  useEffect(() => {
    if (viewMode !== 'grouped' || !isInitialized) return;
    if (searchTerm.trim() !== '') return; // не сохраняем во время поиска
    const toSave = {
      collapsedGlobalManagement,
      collapsedDepartmentManagement: Array.from(collapsedDepartmentManagement),
      collapsedDivisions: Array.from(collapsedDivisions),
      collapsedSubdivisions: Array.from(collapsedSubdivisions),
    };
    sessionStorage.setItem(fullStorageKey, JSON.stringify(toSave));
  }, [
    collapsedGlobalManagement,
    collapsedDepartmentManagement,
    collapsedDivisions,
    collapsedSubdivisions,
    fullStorageKey,
    viewMode,
    isInitialized,
    searchTerm,
  ]);

  // Автоматическое раскрытие всех групп при поиске и восстановление при очистке
  useEffect(() => {
    if (viewMode !== 'grouped' || !groupedData || !isInitialized) return;

    const isSearchActive = searchTerm.trim() !== '';

    if (isSearchActive) {
      // Сохраняем текущее состояние только один раз при начале поиска
      if (savedCollapsed === null) {
        setSavedCollapsed({
          collapsedDivisions: new Set(collapsedDivisions),
          collapsedSubdivisions: new Set(collapsedSubdivisions),
          collapsedGlobalManagement,
          collapsedDepartmentManagement: new Set(collapsedDepartmentManagement),
        });
      }
      // Раскрываем всё
      setCollapsedGlobalManagement(false);
      setCollapsedDivisions(new Set());
      setCollapsedSubdivisions(new Set());
      setCollapsedDepartmentManagement(new Set());
    } else {
      // Восстанавливаем состояние, если оно было сохранено
      if (savedCollapsed !== null) {
        setCollapsedDivisions(savedCollapsed.collapsedDivisions);
        setCollapsedSubdivisions(savedCollapsed.collapsedSubdivisions);
        setCollapsedGlobalManagement(savedCollapsed.collapsedGlobalManagement);
        setCollapsedDepartmentManagement(savedCollapsed.collapsedDepartmentManagement);
        setSavedCollapsed(null);
      }
    }
  }, [searchTerm, viewMode, groupedData, isInitialized]);

  // Вспомогательные функции рендеринга
  const renderPersonCell = (person: Employee) => (
    <div className="personnel-person-name">{truncate(person.full_name, 30)}</div>
  );

  const renderPhones = (person: Employee) => (
    <div className="text-sm text-gray-900">
      <div>раб. {person.work_phone || '—'}</div>
      <div>сот. {person.personal_phone || '—'}</div>
    </div>
  );

  const renderShaInfo = (person: Employee) => (
    <div className="text-sm text-gray-900">
      {person.sha_details && `${person.sha_details.access_level} класс / `}
      {person.form_state_secrets || '—'}
    </div>
  );

  const renderCategoryBadges = (person: Employee) => (
    <div>
      {person.category === 'management' && (
        <div className="personnel-badge personnel-badge--red">
          <CircleUserRound className="h-3 w-3" />
          <span>Руководство</span>
        </div>
      )}
      {person.is_material_responsible && (
        <div className="personnel-badge personnel-badge--blue">
          <ClipboardList className="h-3 w-3" />
          <span>МОЛ</span>
        </div>
      )}
      {person.is_sha_worker && (
        <div className="personnel-badge personnel-badge--green">
          <Shield className="h-3 w-3" />
          <span>ШР</span>
        </div>
      )}
    </div>
  );

  const renderDeleteButton = (id: string) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onDelete(id);
      }}
      className="personnel-delete-button"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );

  function truncate(str: string, maxLen: number) {
    if (!str) return '';
    return str.length > maxLen ? `${str.substring(0, maxLen)}...` : str;
  }

  // Обновлённый colSpan: добавляем 1 для колонки "№ п/п"
  const colSpan = hasEditPermission ? 9 : 8;

  // Обработчики сворачивания/разворачивания (блокируются при активном поиске)
  const toggleDivision = (divisionId: string) => {
    if (searchTerm.trim() !== '') return;
    setCollapsedDivisions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(divisionId)) newSet.delete(divisionId);
      else newSet.add(divisionId);
      return newSet;
    });
  };

  const toggleSubdivision = (divisionId: string, subdivisionId: string) => {
    if (searchTerm.trim() !== '') return;
    const key = `${divisionId}-${subdivisionId}`;
    setCollapsedSubdivisions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) newSet.delete(key);
      else newSet.add(key);
      return newSet;
    });
  };

  const toggleGlobalManagementHandler = () => {
    if (searchTerm.trim() !== '') return;
    setCollapsedGlobalManagement(prev => !prev);
  };

  const toggleDepartmentManagement = (divisionId: string) => {
    if (searchTerm.trim() !== '') return;
    setCollapsedDepartmentManagement(prev => {
      const newSet = new Set(prev);
      if (newSet.has(divisionId)) newSet.delete(divisionId);
      else newSet.add(divisionId);
      return newSet;
    });
  };

  const getDivisionEmployeeCount = (divisionId: string): number => {
    const div = groupedData?.divisions[divisionId];
    if (!div) return 0;
    let count = div.managers.length;
    Object.values(div.subdivisions).forEach(sub => {
      count += sub.employees.length;
    });
    return count;
  };

  const isRowHighlighted = (person: Employee) => {
    if (!searchTerm.trim()) return false;
    return person.full_name.toLowerCase().includes(searchTerm.toLowerCase());
  };

  // Рендеринг плоского режима
  if (viewMode === 'flat') {
    return (
      <div className="personnel-table-container">
        <table className="personnel-table">
          <thead className="personnel-table-header">
            <tr>
              <th className="personnel-table-header-cell-pp">№ п/п</th>
              <th className="personnel-table-header-cell">Фамилия, имя, отчество</th>
              <th className="personnel-table-header-cell">Звание</th>
              <th className="personnel-table-header-cell">Должность</th>
              <th className="personnel-table-header-cell">Подразделение</th>
              <th className="personnel-table-header-cell">Телефон</th>
              <th className="personnel-table-header-cell">Класс сети/ Форма ГТ</th>
              <th className="personnel-table-header-cell">Принадлежность</th>
              {hasEditPermission && (
                <th className="personnel-table-header-cell">Действия</th>
              )}
            </tr>
          </thead>
          <tbody className="personnel-table-body">
            {flatSortedData.map((person, idx) => (
              <tr
                key={person.id}
                onClick={() => onPersonClick(person)}
                className={`personnel-table-row ${isRowHighlighted(person) ? 'personnel-table-row-highlighted' : ''}`}
              >
                <td className="personnel-table-cell personnel-table-cell-index">{idx + 1}</td>
                <td className="personnel-table-cell personnel-table-cell-name">{renderPersonCell(person)}</td>
                <td className="personnel-table-cell">{person.rank || '—'}</td>
                <td className="personnel-table-cell">{truncate(person.position, 30)}</td>
                <td className="personnel-table-cell">{person.division?.name || '—'}</td>
                <td className="personnel-table-cell">{renderPhones(person)}</td>
                <td className="personnel-table-cell">{renderShaInfo(person)}</td>
                <td className="personnel-table-cell personnel-table-cell-category">
                  {renderCategoryBadges(person)}
                </td>
                {hasEditPermission && (
                  <td className="personnel-table-cell">
                    {renderDeleteButton(person.id)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Для grouped режима: если данные ещё не готовы, ничего не рендерим
  if (!isInitialized || !groupedData) return null;

  // Рендеринг сгруппированного режима со сквозной нумерацией
  let rowIndex = 0; // сквозной счётчик для отображаемых строк сотрудников

  return (
    <div className="personnel-table-container">
      <table className="personnel-table">
        <thead className="personnel-table-header">
          <tr>
            <th className="personnel-table-header-cell">№ п/п</th>
            <th className="personnel-table-header-cell">Фамилия, имя, отчество</th>
            <th className="personnel-table-header-cell">Звание</th>
            <th className="personnel-table-header-cell">Должность</th>
            <th className="personnel-table-header-cell">Подразделение</th>
            <th className="personnel-table-header-cell">Телефон</th>
            <th className="personnel-table-header-cell">Класс сети/ Форма ГТ</th>
            <th className="personnel-table-header-cell">Принадлежность</th>
            {hasEditPermission && (
              <th className="personnel-table-header-cell">Действия</th>
            )}
          </tr>
        </thead>
        <tbody className="personnel-table-body">
          {/* Глобальное руководство */}
          {groupedData.globalManagement && groupedData.globalManagement.employees.length > 0 && (
            <>
              <tr
                className="personnel-division-header-row personnel-management-header"
                onClick={toggleGlobalManagementHandler}
                style={{ cursor: 'pointer' }}
              >
                <td colSpan={colSpan} className="personnel-division-header-cell">
                  <div className="personnel-division-header-content">
                    <button
                      className="personnel-collapse-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleGlobalManagementHandler();
                      }}
                    >
                      {collapsedGlobalManagement ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                    </button>
                    <span>Руководство (главный руководитель и заместители)</span>
                  </div>
                </td>
              </tr>
              {!collapsedGlobalManagement &&
                groupedData.globalManagement.employees.map(person => {
                  const currentIndex = ++rowIndex;
                  return (
                    <tr
                      key={person.id}
                      onClick={() => onPersonClick(person)}
                      className={`personnel-table-row personnel-management-row ${isRowHighlighted(person) ? 'personnel-table-row-highlighted' : ''}`}
                    >
                      <td className="personnel-table-cell personnel-table-cell-index">{currentIndex}</td>
                      <td className="personnel-table-cell personnel-table-cell-name">{renderPersonCell(person)}</td>
                      <td className="personnel-table-cell">{person.rank || '—'}</td>
                      <td className="personnel-table-cell">{truncate(person.position, 30)}</td>
                      <td className="personnel-table-cell">{person.division?.name || '—'}</td>
                      <td className="personnel-table-cell">{renderPhones(person)}</td>
                      <td className="personnel-table-cell">{renderShaInfo(person)}</td>
                      <td className="personnel-table-cell personnel-table-cell-category">
                        {renderCategoryBadges(person)}
                      </td>
                      {hasEditPermission && (
                        <td className="personnel-table-cell">
                          {renderDeleteButton(person.id)}
                        </td>
                      )}
                    </tr>
                  );
                })}
            </>
          )}

          {/* Подразделения */}
          {groupedData.sortedDivisionIds.map(divisionId => {
            const division = groupedData.divisions[divisionId];
            const isDivisionCollapsed = collapsedDivisions.has(divisionId);
            const hasManagers = division.managers.length > 0;
            const isDeptMgmtCollapsed = collapsedDepartmentManagement.has(divisionId);
            const employeeCount = getDivisionEmployeeCount(divisionId);

            return (
              <React.Fragment key={divisionId}>
                {/* Заголовок подразделения */}
                <tr
                  className="personnel-division-header-row"
                  onClick={() => toggleDivision(divisionId)}
                  style={{ cursor: 'pointer' }}
                >
                  <td colSpan={colSpan} className="personnel-division-header-cell">
                    <div className="personnel-division-header-content">
                      <button
                        className="personnel-collapse-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDivision(divisionId);
                        }}
                      >
                        {isDivisionCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                      </button>
                      <span>{division.divisionName}</span>
                      <span className="personnel-division-employee-count"> ({employeeCount})</span>
                    </div>
                  </td>
                </tr>
                {!isDivisionCollapsed && (
                  <>
                    {/* Руководство отдела */}
                    {hasManagers && (
                      <>
                        <tr
                          className="personnel-subdivision-header-row"
                          onClick={() => toggleDepartmentManagement(divisionId)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td colSpan={colSpan} className="personnel-subdivision-header-cell">
                            <div className="personnel-division-header-content">
                              <button
                                className="personnel-collapse-button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleDepartmentManagement(divisionId);
                                }}
                              >
                                {isDeptMgmtCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                              </button>
                              <span>Руководство отдела</span>
                            </div>
                          </td>
                        </tr>
                        {!isDeptMgmtCollapsed &&
                          division.managers.map(person => {
                            const currentIndex = ++rowIndex;
                            return (
                              <tr
                                key={person.id}
                                onClick={() => onPersonClick(person)}
                                className={`personnel-table-row personnel-management-row ${isRowHighlighted(person) ? 'personnel-table-row-highlighted' : ''}`}
                              >
                                <td className="personnel-table-cell personnel-table-cell-index">{currentIndex}</td>
                                <td className="personnel-table-cell personnel-table-cell-name">{renderPersonCell(person)}</td>
                                <td className="personnel-table-cell">{person.rank || '—'}</td>
                                <td className="personnel-table-cell">{truncate(person.position, 30)}</td>
                                <td className="personnel-table-cell">{person.division?.name || '—'}</td>
                                <td className="personnel-table-cell">{renderPhones(person)}</td>
                                <td className="personnel-table-cell">{renderShaInfo(person)}</td>
                                <td className="personnel-table-cell personnel-table-cell-category">
                                  {renderCategoryBadges(person)}
                                </td>
                                {hasEditPermission && (
                                  <td className="personnel-table-cell">
                                    {renderDeleteButton(person.id)}
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                      </>
                    )}

                    {/* Отделения */}
                    {division.sortedSubdivisionIds?.map(subdivisionId => {
                      const subdivision = division.subdivisions[subdivisionId];
                      const subKey = `${divisionId}-${subdivisionId}`;
                      const isSubCollapsed = collapsedSubdivisions.has(subKey);
                      const subEmployeeCount = subdivision.employees.length;
                      return (
                        <React.Fragment key={subdivisionId}>
                          <tr
                            className="personnel-subdivision-header-row"
                            onClick={() => toggleSubdivision(divisionId, subdivisionId)}
                            style={{ cursor: 'pointer' }}
                          >
                            <td colSpan={colSpan} className="personnel-subdivision-header-cell">
                              <div className="personnel-subdivision-header-content">
                                <button
                                  className="personnel-collapse-button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSubdivision(divisionId, subdivisionId);
                                  }}
                                >
                                  {isSubCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                                </button>
                                <span>{subdivision.subdivisionName}</span>
                                <span className="personnel-subdivision-employee-count"> ({subEmployeeCount})</span>
                              </div>
                            </td>
                          </tr>
                          {!isSubCollapsed &&
                            subdivision.employees.map(person => {
                              const currentIndex = ++rowIndex;
                              return (
                                <tr
                                  key={person.id}
                                  onClick={() => onPersonClick(person)}
                                  className={`personnel-table-row ${person.category === 'management' ? 'personnel-management-row' : ''} ${isRowHighlighted(person) ? 'personnel-table-row-highlighted' : ''}`}
                                >
                                  <td className="personnel-table-cell personnel-table-cell-index">{currentIndex}</td>
                                  <td className="personnel-table-cell personnel-table-cell-name">{renderPersonCell(person)}</td>
                                  <td className="personnel-table-cell">{person.rank || '—'}</td>
                                  <td className="personnel-table-cell">{truncate(person.position, 30)}</td>
                                  <td className="personnel-table-cell">{person.division?.name || '—'}</td>
                                  <td className="personnel-table-cell">{renderPhones(person)}</td>
                                  <td className="personnel-table-cell">{renderShaInfo(person)}</td>
                                  <td className="personnel-table-cell personnel-table-cell-category">
                                    {renderCategoryBadges(person)}
                                  </td>
                                  {hasEditPermission && (
                                    <td className="personnel-table-cell">
                                      {renderDeleteButton(person.id)}
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
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
}