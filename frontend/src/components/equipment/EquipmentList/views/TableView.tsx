// TableView.tsx
import React, { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import { Equipment } from '../../../../types';
import { Trash2 } from 'lucide-react';
import { getStatusIcon, getStatusColor } from '../../../../utils/statusUtils';
import { format } from 'date-fns';
import './style.css';

interface TableViewProps {
  equipment: Equipment[];
  onDelete: (equipment: Equipment) => void;
  divisionId?: string;
  subdivisionId?: string;
  activeTab?: string;
  disableRowClick?: boolean;
  showActions?: boolean;
  searchTerm?: string;
}

export function TableView({
  equipment,
  onDelete,
  divisionId,
  subdivisionId,
  activeTab,
  disableRowClick = false,
  showActions = true,
  searchTerm = '',
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

  // Единая сортировка: без подразделения → по подразделениям → внутри по отделениям → по наименованию.
  const sortedEquipment = useMemo(() => {
    const result: Equipment[] = [];

    // Техника без подразделения
    const noDiv = equipment.filter((e) => !e.division);
    if (noDiv.length) {
      result.push(...[...noDiv].sort((a, b) => a.name.localeCompare(b.name)));
    }

    // Группировка по подразделениям и отделениям
    const divMap = new Map<
      string,
      { division: any; subs: Map<string, { subdivision: any; items: Equipment[] }> }
    >();

    equipment.forEach((item) => {
      if (!item.division) return;
      const divId = String(item.division.id);
      if (!divMap.has(divId)) {
        divMap.set(divId, { division: item.division, subs: new Map() });
      }
      const entry = divMap.get(divId)!;
      const subId = String(item.subdivision?.id || 'no-subdivision');
      if (!entry.subs.has(subId)) {
        entry.subs.set(subId, {
          subdivision: item.subdivision || { id: 'no-subdivision', name: 'Без отделения', order: 9999 },
          items: [],
        });
      }
      entry.subs.get(subId)!.items.push(item);
    });

    const sortedDivs = Array.from(divMap.entries()).sort(
      (a, b) => (a[1].division.order || 9999) - (b[1].division.order || 9999)
    );
    for (const [, div] of sortedDivs) {
      const sortedSubs = Array.from(div.subs.entries()).sort(
        (a, b) => (a[1].subdivision.order || 9999) - (b[1].subdivision.order || 9999)
      );
      for (const [, sub] of sortedSubs) {
        result.push(...[...sub.items].sort((a, b) => a.name.localeCompare(b.name)));
      }
    }

    return result;
  }, [equipment]);

  const handleRowClick = useCallback(
    (item: Equipment) => {
      if (disableRowClick) return;
      navigate(`/equipment/${item.id}`, {
        state: { from: 'equipment-section', divisionId, subdivisionId, activeTab },
      });
    },
    [disableRowClick, navigate, divisionId, subdivisionId, activeTab],
  );

  const isRowHighlighted = useCallback(
    (item: Equipment): boolean => {
      if (!searchTerm.trim()) return false;
      const term = searchTerm.toLowerCase();
      return (
        item.name.toLowerCase().includes(term) ||
        (item.serial_number || '').toLowerCase().includes(term) ||
        (item.inventory_number?.toLowerCase().includes(term) ?? false) ||
        (item.assigned_to?.full_name?.toLowerCase().includes(term) ?? false) ||
        (item.interest_organ?.name?.toLowerCase().includes(term) ?? false)
      );
    },
    [searchTerm],
  );

  if (equipment.length === 0) return null;

  return (
    <div className="tv-table-container">
      <table className="tv-equipment-table">
        <thead className="tv-table-header">
          <tr>
            <th className="tv-table-header-cell-equipment-pp">№ п/п</th>
            <th className="tv-table-header-cell-equipment">Название</th>
            <th className="tv-table-header-cell-equipment">Серийный номер</th>
            <th className="tv-table-header-cell-equipment">Инв. номер</th>
            <th className="tv-table-header-cell-equipment">Дата производства</th>
            <th className="tv-table-header-cell-equipment">Дата ввода в экспл.</th>
            <th className="tv-table-header-cell-equipment">Модель</th>
            <th className="tv-table-header-cell-equipment">Категория</th>
            <th className="tv-table-header-cell-equipment">В чьих интересах</th>
            <th className="tv-table-header-cell-equipment">Подразделение</th>
            <th className="tv-table-header-cell-equipment">Закреплено за</th>
            <th className="tv-table-header-cell-equipment">Статус</th>
            {shouldShowActions && <th className="tv-table-header-cell-equipment">Действия</th>}
          </tr>
        </thead>
        <tbody className="table-body">
          {sortedEquipment.map((item, idx) => {
            const StatusIcon = getStatusIcon(item.status);
            return (
              <tr
                key={item.id}
                onClick={() => handleRowClick(item)}
                className={`tv-table-row-equipment ${isRowHighlighted(item) ? 'tv-table-row-highlighted' : ''}`}
                style={disableRowClick ? { cursor: 'default' } : { cursor: 'pointer' }}
              >
                <td className="tv-table-cell-equipment tv-table-cell-index">{idx + 1}</td>
                <td className="tv-table-cell-equipment tv-table-cell-name">
                  <div className="tv-cell-content-full-width">{item.name}</div>
                </td>
                <td className="tv-table-cell-equipment">{item.serial_number}</td>
                <td className="tv-table-cell-equipment">{item.inventory_number}</td>
                <td className="tv-table-cell-equipment">{formatDate(item.manufacturing_date)}</td>
                <td className="tv-table-cell-equipment">{formatDate(item.exploitation_date)}</td>
                <td className="tv-table-cell-equipment">{item.type || '-'}</td>
                <td className="tv-table-cell-equipment">{item.category_display}</td>
                <td className="tv-table-cell-equipment">{formatInterestOrgan(item.interest_organ)}</td>
                <td className="tv-table-cell-equipment">
                  <div className="tv-division-container">
                    <div className="tv-division-name">{item.division?.name || '-'}</div>
                    {item.subdivision?.name && <div className="tv-subdivision-name">{item.subdivision.name}</div>}
                  </div>
                </td>
                <td className="tv-table-cell-equipment tv-table-cell-assigned-to">
                  <div className="tv-cell-content">
                    {item.assigned_to ? (
                      <>
                        <span>{formatEmployeeName(item.assigned_to)}</span>
                        {item.assigned_to.position && <span className="tv-position-text">{item.assigned_to.position}</span>}
                      </>
                    ) : '-'}
                  </div>
                </td>
                <td className="tv-table-cell-equipment">
                  <div className={`tv-cell-content ${getStatusColor(item.status)}`}>
                    <StatusIcon className="tv-status-icon" />
                  </div>
                </td>
                {shouldShowActions && (
                  <td className="tv-table-cell-actions">
                    <div className="tv-actions-container">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(item);
                        }}
                        className="tv-delete-button"
                      >
                        <Trash2 className="tv-action-icon" />
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