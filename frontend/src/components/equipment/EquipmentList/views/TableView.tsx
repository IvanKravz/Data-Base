// TableView.tsx — полностью обновленная версия
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  viewMode: 'flat' | 'grouped';
  searchTerm?: string;
  storageKey?: string;
}

export function TableView({
  equipment,
  onDelete,
  divisionId,
  subdivisionId,
  activeTab,
  disableRowClick = false,
  showActions = true,
  viewMode,
  searchTerm = '',
  storageKey = 'equipment_default',
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

  const fullStorageKey = useMemo(
    () => `equipment_table_collapsed_${storageKey}_${viewMode}`,
    [storageKey, viewMode]
  );

  const [collapsedDivisions, setCollapsedDivisions] = useState<Set<string>>(new Set());
  const [collapsedSubdivisions, setCollapsedSubdivisions] = useState<Set<string>>(new Set());
  const [collapsedNoDivision, setCollapsedNoDivision] = useState<boolean>(true);
  const [savedCollapsed, setSavedCollapsed] = useState<{
    collapsedDivisions: Set<string>;
    collapsedSubdivisions: Set<string>;
    collapsedNoDivision: boolean;
  } | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    setIsInitialized(false);
  }, [viewMode]);

  const sortEquipmentInGroup = useCallback((list: Equipment[]): Equipment[] => {
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const formatDate = useCallback((dateString: string | null | undefined): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return format(date, 'dd.MM.yyyy');
    } catch {
      return '-';
    }
  }, []);

  const formatEmployeeName = useCallback((employee: { full_name: string }) => {
    if (!employee?.full_name) return '-';
    const parts = employee.full_name.split(' ');
    if (parts.length < 3) return employee.full_name;
    const lastName = parts[0];
    const firstNameInitial = parts[1] ? `${parts[1][0]}.` : '';
    const middleNameInitial = parts[2] ? `${parts[2][0]}.` : '';
    return `${lastName} ${firstNameInitial}${middleNameInitial}`;
  }, []);

  const formatInterestOrgan = useCallback((interestOrgan: any): string => {
    if (!interestOrgan) return '-';
    if (typeof interestOrgan === 'object' && interestOrgan.name) return interestOrgan.name;
    if (typeof interestOrgan === 'string') return interestOrgan;
    return '-';
  }, []);

  const groupedData = useMemo(() => {
    const result = {
      noDivision: null as { equipment: Equipment[] } | null,
      divisions: new Map<string, {
        division: any;
        managers: Equipment[];
        subdivisions: Map<string, { subdivision: any; equipment: Equipment[] }>;
      }>(),
    };

    equipment.forEach(item => {
      if (!item.division) {
        if (!result.noDivision) result.noDivision = { equipment: [] };
        result.noDivision.equipment.push(item);
        return;
      }
      const divId = item.division.id;
      if (!result.divisions.has(divId)) {
        result.divisions.set(divId, {
          division: item.division,
          managers: [],
          subdivisions: new Map(),
        });
      }
      const divEntry = result.divisions.get(divId)!;
      const subId = item.subdivision?.id || 'no-subdivision';
      if (!divEntry.subdivisions.has(subId)) {
        divEntry.subdivisions.set(subId, {
          subdivision: item.subdivision || { id: 'no-subdivision', name: 'Без отделения', order: 9999 },
          equipment: [],
        });
      }
      divEntry.subdivisions.get(subId)!.equipment.push(item);
    });

    if (result.noDivision) {
      result.noDivision.equipment = sortEquipmentInGroup(result.noDivision.equipment);
    }
    for (const div of result.divisions.values()) {
      for (const sub of div.subdivisions.values()) {
        sub.equipment = sortEquipmentInGroup(sub.equipment);
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
  }, [equipment, sortEquipmentInGroup]);

  const flatSortedData = useMemo(() => {
    if (viewMode !== 'flat') return [];
    const result: Equipment[] = [];
    if (groupedData.noDivision) {
      result.push(...groupedData.noDivision.equipment);
    }
    for (const [, div] of groupedData.divisions) {
      for (const [, sub] of div.subdivisions) {
        result.push(...sub.equipment);
      }
    }
    return result;
  }, [groupedData, viewMode]);

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
      } catch (e) { }
    }

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

  const toggleDivision = useCallback((id: string) => {
    if (searchTerm.trim() !== '') return;
    setCollapsedDivisions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
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

  const toggleNoDivision = useCallback(() => {
    if (searchTerm.trim() !== '') return;
    setCollapsedNoDivision(prev => !prev);
  }, [searchTerm]);

  const handleRowClick = useCallback((item: Equipment) => {
    if (disableRowClick) return;
    navigate(`/equipment/${item.id}`, {
      state: { from: 'equipment-section', divisionId, subdivisionId, activeTab },
    });
  }, [disableRowClick, navigate, divisionId, subdivisionId, activeTab]);

  const colSpan = shouldShowActions ? 13 : 12; // увеличено на 1 из-за добавления столбца "№ п/п"

  const getDivisionEquipmentCount = useCallback((divisionId: string): number => {
    const div = groupedData.divisions.get(divisionId);
    if (!div) return 0;
    let count = 0;
    for (const sub of div.subdivisions.values()) {
      count += sub.equipment.length;
    }
    return count;
  }, [groupedData]);

  const isRowHighlighted = useCallback((item: Equipment): boolean => {
    if (!searchTerm.trim()) return false;
    const term = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(term) ||
      item.serial_number.toLowerCase().includes(term) ||
      (item.inventory_number?.toLowerCase().includes(term) ?? false) ||
      (item.assigned_to?.full_name?.toLowerCase().includes(term) ?? false) ||
      (item.interest_organ?.name?.toLowerCase().includes(term) ?? false)
    );
  }, [searchTerm]);

  // Плоский режим
  if (viewMode === 'flat') {
    return (
      <div className="equipment-table-container">
        <table className="equipment-table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell-equipment-pp">№ п/п</th>
              <th className="table-header-cell-equipment">Название</th>
              <th className="table-header-cell-equipment">Серийный номер</th>
              <th className="table-header-cell-equipment">Инв. номер</th>
              <th className="table-header-cell-equipment">Дата производства</th>
              <th className="table-header-cell-equipment">Дата ввода в экспл.</th>
              <th className="table-header-cell-equipment">Модель</th>
              <th className="table-header-cell-equipment">Категория</th>
              <th className="table-header-cell-equipment">В чьих интересах</th>
              <th className="table-header-cell-equipment">Подразделение</th>
              <th className="table-header-cell-equipment">Закреплено за</th>
              <th className="table-header-cell-equipment">Статус</th>
              {shouldShowActions && <th className="table-header-cell-equipment">Действия</th>}
            </tr>
          </thead>
          <tbody className="table-body">
            {flatSortedData.map((item, idx) => {
              const StatusIcon = getStatusIcon(item.status);
              return (
                <tr
                  key={item.id}
                  onClick={() => handleRowClick(item)}
                  className={`table-row-equipment ${isRowHighlighted(item) ? 'table-row-highlighted' : ''}`}
                  style={disableRowClick ? { cursor: 'default' } : { cursor: 'pointer' }}
                >
                  <td className="table-cell-equipment table-cell-index">{idx + 1}</td>
                  <td className="table-cell-equipment table-cell-name">
                    <div className="cell-content-full-width">{item.name}</div>
                  </td>
                  <td className="table-cell-equipment">{item.serial_number}</td>
                  <td className="table-cell-equipment">{item.inventory_number}</td>
                  <td className="table-cell-equipment">{formatDate(item.manufacturing_date)}</td>
                  <td className="table-cell-equipment">{formatDate(item.exploitation_date)}</td>
                  <td className="table-cell-equipment">{item.type || '-'}</td>
                  <td className="table-cell-equipment">{item.category_display}</td>
                  <td className="table-cell-equipment">{formatInterestOrgan(item.interest_organ)}</td>
                  <td className="table-cell-equipment">
                    <div className="division-container">
                      <div className="division-name">{item.division?.name || '-'}</div>
                      {item.subdivision?.name && <div className="subdivision-name">{item.subdivision.name}</div>}
                    </div>
                  </td>
                  <td className="table-cell-equipment table-cell-assigned-to">
                    <div className="cell-content">
                      {item.assigned_to ? (
                        <>
                          <span>{formatEmployeeName(item.assigned_to)}</span>
                          {item.assigned_to.position && <span className="position-text">{item.assigned_to.position}</span>}
                        </>
                      ) : '-'}
                    </div>
                  </td>
                  <td className="table-cell-equipment">
                    <div className={`cell-content ${getStatusColor(item.status)}`}>
                      <StatusIcon className="status-icon" />
                    </div>
                  </td>
                  {shouldShowActions && (
                    <td className="table-cell-actions">
                      <div className="actions-container">
                        <button onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="delete-button">
                          <Trash2 className="action-icon" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // Группированный режим
  let rowIndex = 0; // сквозной счетчик для отображаемых строк техники

  return (
    <div className="equipment-table-container">
      <table className="equipment-table">
        <thead className="table-header">
          <tr>
            <th className="table-header-cell-equipment">№ п/п</th>
            <th className="table-header-cell-equipment">Название</th>
            <th className="table-header-cell-equipment">Серийный номер</th>
            <th className="table-header-cell-equipment">Инв. номер</th>
            <th className="table-header-cell-equipment">Дата производства</th>
            <th className="table-header-cell-equipment">Дата ввода в экспл.</th>
            <th className="table-header-cell-equipment">Модель</th>
            <th className="table-header-cell-equipment">Категория</th>
            <th className="table-header-cell-equipment">В чьих интересах</th>
            <th className="table-header-cell-equipment">Подразделение</th>
            <th className="table-header-cell-equipment">Закреплено за</th>
            <th className="table-header-cell-equipment">Статус</th>
            {shouldShowActions && <th className="table-header-cell-equipment">Действия</th>}
          </tr>
        </thead>
        <tbody className="table-body">
          {/* Техника без подразделения */}
          {groupedData.noDivision && groupedData.noDivision.equipment.length > 0 && (
            <>
              <tr
                className="division-header-row no-division-header"
                onClick={toggleNoDivision}
                style={{ cursor: searchTerm.trim() ? 'default' : 'pointer' }}
              >
                <td colSpan={colSpan} className="equipment-division-header-cell">
                  <div className="division-header-content">
                    <button className="collapse-button" onClick={(e) => { e.stopPropagation(); toggleNoDivision(); }}>
                      {collapsedNoDivision ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                    </button>
                    <span>Техника без подразделения</span>
                    <span className="division-employee-count"> ({groupedData.noDivision.equipment.length})</span>
                  </div>
                </td>
              </tr>
              {!collapsedNoDivision &&
                groupedData.noDivision.equipment.map(item => {
                  const StatusIcon = getStatusIcon(item.status);
                  const currentIndex = ++rowIndex;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => handleRowClick(item)}
                      className={`table-row-equipment no-division-row ${isRowHighlighted(item) ? 'table-row-highlighted' : ''}`}
                    >
                      <td className="table-cell-equipment table-cell-index">{currentIndex}</td>
                      <td className="table-cell-equipment table-cell-name">{item.name}</td>
                      <td className="table-cell-equipment">{item.serial_number}</td>
                      <td className="table-cell-equipment">{item.inventory_number}</td>
                      <td className="table-cell-equipment">{formatDate(item.manufacturing_date)}</td>
                      <td className="table-cell-equipment">{formatDate(item.exploitation_date)}</td>
                      <td className="table-cell-equipment">{item.type || '-'}</td>
                      <td className="table-cell-equipment">{item.category_display}</td>
                      <td className="table-cell-equipment">{formatInterestOrgan(item.interest_organ)}</td>
                      <td className="table-cell-equipment"><div className="division-container"><div className="division-name">{item.division?.name || '-'}</div>{item.subdivision?.name && <div className="subdivision-name">{item.subdivision.name}</div>}</div></td>
                      <td className="table-cell-equipment table-cell-assigned-to"><div className="cell-content">{item.assigned_to ? <>{formatEmployeeName(item.assigned_to)}{item.assigned_to.position && <span className="position-text">{item.assigned_to.position}</span>}</> : '-'}</div></td>
                      <td className="table-cell-equipment"><div className={`cell-content ${getStatusColor(item.status)}`}><StatusIcon className="status-icon" /></div></td>
                      {shouldShowActions && <td className="table-cell-actions"><div className="actions-container"><button onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="delete-button"><Trash2 className="action-icon" /></button></div></td>}
                    </tr>
                  );
                })}
            </>
          )}

          {/* Подразделения */}
          {Array.from(groupedData.divisions.entries()).map(([divisionId, div]) => {
            const isDivisionCollapsed = collapsedDivisions.has(divisionId);
            const divisionCount = getDivisionEquipmentCount(divisionId);
            return (
              <React.Fragment key={divisionId}>
                <tr
                  className="division-header-row"
                  onClick={() => toggleDivision(divisionId)}
                  style={{ cursor: searchTerm.trim() ? 'default' : 'pointer' }}
                >
                  <td colSpan={colSpan} className="equipment-division-header-cell">
                    <div className="division-header-content">
                      <button className="collapse-button" onClick={(e) => { e.stopPropagation(); toggleDivision(divisionId); }}>
                        {isDivisionCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                      </button>
                      <span>{div.division.name}</span>
                      <span className="division-employee-count"> ({divisionCount})</span>
                    </div>
                  </td>
                </tr>
                {!isDivisionCollapsed &&
                  Array.from(div.subdivisions.entries()).map(([subdivisionId, sub]) => {
                    const subKey = `${divisionId}-${subdivisionId}`;
                    const isSubCollapsed = collapsedSubdivisions.has(subKey);
                    const subCount = sub.equipment.length;
                    return (
                      <React.Fragment key={subdivisionId}>
                        <tr
                          className="subdivision-header-row"
                          onClick={() => toggleSubdivision(divisionId, subdivisionId)}
                          style={{ cursor: searchTerm.trim() ? 'default' : 'pointer' }}
                        >
                          <td colSpan={colSpan} className="equipment-subdivision-header-cell">
                            <div className="subdivision-header-content">
                              <button className="collapse-button" onClick={(e) => { e.stopPropagation(); toggleSubdivision(divisionId, subdivisionId); }}>
                                {isSubCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                              </button>
                              <span>{sub.subdivision.name}</span>
                              <span className="subdivision-employee-count"> ({subCount})</span>
                            </div>
                          </td>
                        </tr>
                        {!isSubCollapsed &&
                          sub.equipment.map(item => {
                            const StatusIcon = getStatusIcon(item.status);
                            const currentIndex = ++rowIndex;
                            return (
                              <tr
                                key={item.id}
                                onClick={() => handleRowClick(item)}
                                className={`table-row-equipment ${isRowHighlighted(item) ? 'table-row-highlighted' : ''}`}
                              >
                                <td className="table-cell-equipment table-cell-index">{currentIndex}</td>
                                <td className="table-cell-equipment table-cell-name">{item.name}</td>
                                <td className="table-cell-equipment">{item.serial_number}</td>
                                <td className="table-cell-equipment">{item.inventory_number}</td>
                                <td className="table-cell-equipment">{formatDate(item.manufacturing_date)}</td>
                                <td className="table-cell-equipment">{formatDate(item.exploitation_date)}</td>
                                <td className="table-cell-equipment">{item.type || '-'}</td>
                                <td className="table-cell-equipment">{item.category_display}</td>
                                <td className="table-cell-equipment">{formatInterestOrgan(item.interest_organ)}</td>
                                <td className="table-cell-equipment"><div className="division-container"><div className="division-name">{item.division?.name || '-'}</div>{item.subdivision?.name && <div className="subdivision-name">{item.subdivision.name}</div>}</div></td>
                                <td className="table-cell-equipment table-cell-assigned-to"><div className="cell-content">{item.assigned_to ? <>{formatEmployeeName(item.assigned_to)}{item.assigned_to.position && <span className="position-text">{item.assigned_to.position}</span>}</> : '-'}</div></td>
                                <td className="table-cell-equipment"><div className={`cell-content ${getStatusColor(item.status)}`}><StatusIcon className="status-icon" /></div></td>
                                {shouldShowActions && <td className="table-cell-actions"><div className="actions-container"><button onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="delete-button"><Trash2 className="action-icon" /></button></div></td>}
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