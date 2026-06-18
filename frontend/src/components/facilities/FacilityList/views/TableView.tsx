// TableView.tsx (Facility)
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import { Facility } from '../../../../types';
import { Trash2, LocateFixed, ChevronDown, ChevronRight } from 'lucide-react';
import './style.css';

interface TableViewProps {
  facilities: Facility[];
  onDelete: (id: string) => void;
  onLocate?: (facility: Facility) => void;
  showDifferentFields?: boolean;
  divisionId?: string;
  subdivisionId?: string;
  activeTab?: string;
  filterType?: string | null;
  facilityClassFilter?: string | null;
  viewMode: 'flat' | 'grouped';
  searchTerm?: string;
  storageKey?: string;
}

export function TableView({
  facilities,
  onDelete,
  onLocate,
  showDifferentFields = false,
  divisionId,
  subdivisionId,
  activeTab,
  filterType,
  facilityClassFilter,
  viewMode,
  searchTerm = '',
  storageKey = 'facilities_default',
}: TableViewProps) {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const permissions = user?.permissions;

  const hasChangePermission = useMemo(() =>
    permissions?.models?.Facility?.includes('change') ?? false, [permissions]);
  const hasDeletePermission = useMemo(() =>
    permissions?.models?.Facility?.includes('delete') ?? false, [permissions]);

  const fullStorageKey = useMemo(
    () => `facility_table_collapsed_${storageKey}_${viewMode}`,
    [storageKey, viewMode]
  );

  // Состояния для группированного режима
  const [collapsedDivisions, setCollapsedDivisions] = useState<Set<string>>(new Set());
  const [collapsedSubdivisions, setCollapsedSubdivisions] = useState<Set<string>>(new Set());
  const [collapsedNoDivision, setCollapsedNoDivision] = useState<boolean>(true);
  const [savedCollapsed, setSavedCollapsed] = useState<{
    collapsedDivisions: Set<string>;
    collapsedSubdivisions: Set<string>;
    collapsedNoDivision: boolean;
  } | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const hasClosedFacilities = facilities.some(f => f.is_closed);
  const shouldShowActions = hasChangePermission || hasDeletePermission || onLocate;

  // Сброс инициализации при смене режима
  useEffect(() => {
    setIsInitialized(false);
  }, [viewMode]);

  // ========== Общая функция группировки ==========
  const buildGroupedData = useCallback((items: Facility[]) => {
    const result = {
      noDivision: null as { facilities: Facility[] } | null,
      divisions: new Map<string, {
        division: any;
        subdivisions: Map<string, { subdivision: any; facilities: Facility[] }>;
      }>(),
    };

    items.forEach(facility => {
      if (!facility.division) {
        if (!result.noDivision) result.noDivision = { facilities: [] };
        result.noDivision.facilities.push(facility);
        return;
      }
      const divId = facility.division.id;
      if (!result.divisions.has(divId)) {
        result.divisions.set(divId, {
          division: facility.division,
          subdivisions: new Map(),
        });
      }
      const divEntry = result.divisions.get(divId)!;
      const subId = facility.subdivision?.id || 'no-subdivision';
      if (!divEntry.subdivisions.has(subId)) {
        divEntry.subdivisions.set(subId, {
          subdivision: facility.subdivision || { id: 'no-subdivision', name: 'Без отделения', order: 9999 },
          facilities: [],
        });
      }
      divEntry.subdivisions.get(subId)!.facilities.push(facility);
    });

    const sortFacilitiesInGroup = (list: Facility[]) => [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (result.noDivision) {
      result.noDivision.facilities = sortFacilitiesInGroup(result.noDivision.facilities);
    }
    for (const [, div] of result.divisions) {
      for (const [, sub] of div.subdivisions) {
        sub.facilities = sortFacilitiesInGroup(sub.facilities);
      }
    }

    const sortedDivisions = Array.from(result.divisions.entries()).sort(
      (a, b) => (a[1].division.order || 9999) - (b[1].division.order || 9999)
    );
    for (const [, div] of sortedDivisions) {
      const sortedSubs = Array.from(div.subdivisions.entries()).sort(
        (a, b) => (a[1].subdivision.order || 9999) - (b[1].subdivision.order || 9999)
      );
      div.subdivisions = new Map(sortedSubs);
    }

    return { noDivision: result.noDivision, divisions: new Map(sortedDivisions) };
  }, []);

  const groupedData = useMemo(() => buildGroupedData(facilities), [facilities, buildGroupedData]);

  const flatSortedData = useMemo(() => {
    const result: Facility[] = [];
    if (groupedData.noDivision) {
      result.push(...groupedData.noDivision.facilities);
    }
    for (const [, div] of groupedData.divisions) {
      for (const [, sub] of div.subdivisions) {
        result.push(...sub.facilities);
      }
    }
    return result;
  }, [groupedData]);

  // Инициализация состояний свёрнутости из sessionStorage
  useEffect(() => {
    if (viewMode !== 'grouped' || isInitialized || !groupedData) return;
    const saved = sessionStorage.getItem(fullStorageKey);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (typeof data.collapsedNoDivision === 'boolean') setCollapsedNoDivision(data.collapsedNoDivision);
        if (Array.isArray(data.collapsedDivisions)) setCollapsedDivisions(new Set(data.collapsedDivisions));
        if (Array.isArray(data.collapsedSubdivisions)) setCollapsedSubdivisions(new Set(data.collapsedSubdivisions));
        setIsInitialized(true);
        return;
      } catch (e) {}
    }
    // Нет сохранённых данных – закрываем всё
    const allDivisionIds = Array.from(groupedData.divisions.keys());
    const allSubKeys: string[] = [];
    for (const [divId, div] of groupedData.divisions) {
      for (const subId of div.subdivisions.keys()) {
        allSubKeys.push(`${divId}-${subId}`);
      }
    }
    setCollapsedDivisions(new Set(allDivisionIds));
    setCollapsedSubdivisions(new Set(allSubKeys));
    setCollapsedNoDivision(true);
    setIsInitialized(true);
  }, [viewMode, groupedData, fullStorageKey, isInitialized]);

  // Сохранение состояния в sessionStorage (кроме поиска)
  useEffect(() => {
    if (viewMode !== 'grouped' || !isInitialized) return;
    if (searchTerm.trim() !== '') return;
    const toSave = {
      collapsedNoDivision,
      collapsedDivisions: Array.from(collapsedDivisions),
      collapsedSubdivisions: Array.from(collapsedSubdivisions),
    };
    sessionStorage.setItem(fullStorageKey, JSON.stringify(toSave));
  }, [collapsedNoDivision, collapsedDivisions, collapsedSubdivisions, fullStorageKey, viewMode, isInitialized, searchTerm]);

  // Раскрытие при поиске и восстановление
  useEffect(() => {
    if (viewMode !== 'grouped' || !groupedData || !isInitialized) return;
    const isSearchActive = searchTerm.trim() !== '';

    if (isSearchActive) {
      if (savedCollapsed === null) {
        setSavedCollapsed({
          collapsedDivisions: new Set(collapsedDivisions),
          collapsedSubdivisions: new Set(collapsedSubdivisions),
          collapsedNoDivision,
        });
      }
      setCollapsedNoDivision(false);
      setCollapsedDivisions(new Set());
      setCollapsedSubdivisions(new Set());
    } else {
      if (savedCollapsed !== null) {
        setCollapsedDivisions(savedCollapsed.collapsedDivisions);
        setCollapsedSubdivisions(savedCollapsed.collapsedSubdivisions);
        setCollapsedNoDivision(savedCollapsed.collapsedNoDivision);
        setSavedCollapsed(null);
      }
    }
  }, [searchTerm, viewMode, groupedData, isInitialized]);

  // Обработчики
  const toggleNoDivision = useCallback(() => {
    if (searchTerm.trim() !== '') return;
    setCollapsedNoDivision(prev => !prev);
  }, [searchTerm]);

  const toggleDivision = useCallback((divisionId: string) => {
    if (searchTerm.trim() !== '') return;
    setCollapsedDivisions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(divisionId)) newSet.delete(divisionId);
      else newSet.add(divisionId);
      return newSet;
    });
  }, [searchTerm]);

  const toggleSubdivision = useCallback((divisionId: string, subdivisionId: string) => {
    if (searchTerm.trim() !== '') return;
    const key = `${divisionId}-${subdivisionId}`;
    setCollapsedSubdivisions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) newSet.delete(key);
      else newSet.add(key);
      return newSet;
    });
  }, [searchTerm]);

  const handleRowClick = useCallback((facility: Facility) => {
    const currentSearchParams = new URLSearchParams(window.location.search);
    const state: any = {
      from: 'facilities-section',
      divisionId,
      subdivisionId,
      activeTab,
      filterType,
      facilityClassFilter
    };
    let facilityUrl = `/facilities/${facility.id}`;
    const params = new URLSearchParams();
    const typeFilter = currentSearchParams.get('type');
    const classFilter = currentSearchParams.get('class');
    const viewFilter = currentSearchParams.get('view');
    if (typeFilter) params.append('type', typeFilter);
    if (classFilter) params.append('class', classFilter);
    if (viewFilter) params.append('view', viewFilter);
    const queryString = params.toString();
    if (queryString) facilityUrl += `?${queryString}`;
    navigate(facilityUrl, { state });
  }, [navigate, divisionId, subdivisionId, activeTab, filterType, facilityClassFilter]);

  const isRowHighlighted = useCallback((facility: Facility): boolean => {
    if (!searchTerm.trim()) return false;
    const term = searchTerm.toLowerCase();
    return (
      facility.name.toLowerCase().includes(term) ||
      facility.address.toLowerCase().includes(term) ||
      (facility.type?.name && facility.type.name.toLowerCase().includes(term)) ||
      (facility.facility_class && `${facility.facility_class} класс`.includes(term)) ||
      facility.division_name?.toLowerCase().includes(term) ||
      facility.subdivision_name?.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  // Содержимое строки (без колонки индекса – она добавляется снаружи)
  const renderRowContent = (facility: Facility) => {
    if (!showDifferentFields) {
      return (
        <>
          <td className="facility-table-cell facility-table-cell-primary">{facility.name}</td>
          <td className="facility-table-cell">{facility.type?.name || '-'}</td>
          {hasClosedFacilities && (
            <td className="facility-table-cell">{facility.is_closed ? `${facility.facility_class} класс` : '-'}</td>
          )}
          <td className="facility-table-cell">{facility.address}</td>
          <td className="facility-table-cell">
            <div className="facility-division-container">
              <div className="facility-division-name">{facility.division_name || '-'}</div>
              {facility.subdivision_name && <div className="facility-subdivision-name">{facility.subdivision_name}</div>}
            </div>
          </td>
        </>
      );
    }
    return (
      <>
        <td className="facility-table-cell facility-table-cell-primary">{facility.name}</td>
        <td className="facility-table-cell">{facility.type?.name || '-'}</td>
        <td className="facility-table-cell">{facility.facility_class ? `${facility.facility_class} класс` : '-'}</td>
        <td className="facility-table-cell">{facility.communication_posts?.map(post => post.name).join(', ') || '-'}</td>
        <td className="facility-table-cell">{facility.address}</td>
        <td className="facility-table-cell">
          <div className="facility-division-container">
            <div className="facility-division-name">{facility.division_name || '-'}</div>
            {facility.subdivision_name && <div className="facility-subdivision-name">{facility.subdivision_name}</div>}
          </div>
        </td>
        <td className="facility-table-cell">{facility.inn || '-'}</td>
      </>
    );
  };

  const renderHeader = () => {
    const headers = [];
    // Колонка "№ п/п"
    headers.push(<th key="index" className="facility-table-header-cell-pp">№ п/п</th>);
    if (!showDifferentFields) {
      headers.push(
        <th key="name" className="facility-table-header">Наименование</th>,
        <th key="type" className="facility-table-header">Тип</th>
      );
      if (hasClosedFacilities) headers.push(<th key="class" className="facility-table-header">Класс</th>);
      headers.push(
        <th key="address" className="facility-table-header">Адрес</th>,
        <th key="division" className="facility-table-header">Подразделение</th>
      );
    } else {
      headers.push(
        <th key="name" className="facility-table-header">Наименование</th>,
        <th key="type" className="facility-table-header">Тип</th>,
        <th key="class" className="facility-table-header">Класс</th>,
        <th key="posts" className="facility-table-header">Посты связи</th>,
        <th key="address" className="facility-table-header">Адрес</th>,
        <th key="division" className="facility-table-header">Подразделение</th>,
        <th key="inn" className="facility-table-header">ИНН</th>
      );
    }
    if (shouldShowActions) {
      headers.push(<th key="actions" className="facility-table-header facility-table-cell-actions">Действия</th>);
    }
    return headers;
  };

  // Обновлённый getColspan с учётом колонки индекса
  const getColspan = () => {
    let baseColspan = showDifferentFields ? 7 : (hasClosedFacilities ? 5 : 4);
    baseColspan += 1; // для колонки "№ п/п"
    return baseColspan + (shouldShowActions ? 1 : 0);
  };

  const renderActions = (facility: Facility) => {
    if (!shouldShowActions) return null;
    return (
      <td className="facility-table-cell facility-table-cell-actions">
        <div className="facility-action-buttons">
          {onLocate && (
            <button onClick={(e) => { e.stopPropagation(); onLocate(facility); }} className="facility-locate-btn" aria-label="Найти на карте">
              <LocateFixed className="h-5 w-5" />
            </button>
          )}
          {hasDeletePermission && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(facility.id); }} className="facility-delete-btn" aria-label="Удалить объект">
              <Trash2 className="h-5 w-4" />
            </button>
          )}
        </div>
      </td>
    );
  };

  // Плоский режим
  if (viewMode === 'flat') {
    return (
      <div className="facility-table-container">
        <table className="facility-table">
          <thead>
            <tr>{renderHeader()}</tr>
          </thead>
          <tbody>
            {flatSortedData.map((facility, idx) => (
              <tr
                key={facility.id}
                className={`facility-table-row ${isRowHighlighted(facility) ? 'facility-table-row-highlighted' : ''}`}
                onClick={() => handleRowClick(facility)}
              >
                <td className="facility-table-cell facility-table-cell-index">{idx + 1}</td>
                {renderRowContent(facility)}
                {renderActions(facility)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Группированный режим (со сквозной нумерацией)
  let rowIndex = 0; // сквозной счётчик строк объектов

  return (
    <div className="facility-table-container">
      <table className="facility-table">
        <thead>
          <tr>{renderHeader()}</tr>
        </thead>
        <tbody>
          {groupedData.noDivision && groupedData.noDivision.facilities.length > 0 && (
            <>
              <tr
                className="division-header-row no-division-header"
                onClick={toggleNoDivision}
                style={{ cursor: searchTerm.trim() ? 'default' : 'pointer' }}
              >
                <td colSpan={getColspan()} className="facility-division-header-cell">
                  <div className="division-header-content">
                    <button className="collapse-button" onClick={(e) => { e.stopPropagation(); toggleNoDivision(); }}>
                      {collapsedNoDivision ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                    </button>
                    <span>Объекты без подразделения</span>
                    <span className="division-count"> ({groupedData.noDivision.facilities.length})</span>
                  </div>
                </td>
              </tr>
              {!collapsedNoDivision && groupedData.noDivision.facilities.map(facility => {
                const currentIndex = ++rowIndex;
                return (
                  <tr
                    key={facility.id}
                    className={`facility-table-row no-division-row ${isRowHighlighted(facility) ? 'facility-table-row-highlighted' : ''}`}
                    onClick={() => handleRowClick(facility)}
                  >
                    <td className="facility-table-cell facility-table-cell-index">{currentIndex}</td>
                    {renderRowContent(facility)}
                    {renderActions(facility)}
                  </tr>
                );
              })}
            </>
          )}

          {Array.from(groupedData.divisions.entries()).map(([divisionId, div]) => {
            const isDivisionCollapsed = collapsedDivisions.has(divisionId);
            const divisionCount = Array.from(div.subdivisions.values()).reduce((acc, sub) => acc + sub.facilities.length, 0);
            return (
              <React.Fragment key={divisionId}>
                <tr
                  className="division-header-row"
                  onClick={() => toggleDivision(divisionId)}
                  style={{ cursor: searchTerm.trim() ? 'default' : 'pointer' }}
                >
                  <td colSpan={getColspan()} className="facility-division-header-cell">
                    <div className="division-header-content">
                      <button className="collapse-button" onClick={(e) => { e.stopPropagation(); toggleDivision(divisionId); }}>
                        {isDivisionCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                      </button>
                      <span>{div.division.name}</span>
                      <span className="division-count"> ({divisionCount})</span>
                    </div>
                  </td>
                </tr>
                {!isDivisionCollapsed && Array.from(div.subdivisions.entries()).map(([subdivisionId, sub]) => {
                  const subKey = `${divisionId}-${subdivisionId}`;
                  const isSubCollapsed = collapsedSubdivisions.has(subKey);
                  const subCount = sub.facilities.length;
                  return (
                    <React.Fragment key={subdivisionId}>
                      <tr
                        className="subdivision-header-row"
                        onClick={() => toggleSubdivision(divisionId, subdivisionId)}
                        style={{ cursor: searchTerm.trim() ? 'default' : 'pointer' }}
                      >
                        <td colSpan={getColspan()} className="facility-subdivision-header-cell">
                          <div className="subdivision-header-content">
                            <button className="collapse-button" onClick={(e) => { e.stopPropagation(); toggleSubdivision(divisionId, subdivisionId); }}>
                              {isSubCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                            </button>
                            <span>{sub.subdivision.name}</span>
                            <span className="subdivision-count"> ({subCount})</span>
                          </div>
                        </td>
                      </tr>
                      {!isSubCollapsed && sub.facilities.map(facility => {
                        const currentIndex = ++rowIndex;
                        return (
                          <tr
                            key={facility.id}
                            className={`facility-table-row ${isRowHighlighted(facility) ? 'facility-table-row-highlighted' : ''}`}
                            onClick={() => handleRowClick(facility)}
                          >
                            <td className="facility-table-cell facility-table-cell-index">{currentIndex}</td>
                            {renderRowContent(facility)}
                            {renderActions(facility)}
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