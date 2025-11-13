import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Facility } from '../../../../types';
import { Trash2, LocateFixed } from 'lucide-react';
import { hasPermission } from '../../../../api/utils/permissions'; // Используем общую функцию проверки прав
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
  facilityClassFilter
}: TableViewProps) {
  const navigate = useNavigate();
  
  // Проверяем конкретные права
  const hasViewPermission = hasPermission('facilities', 'view');
  const hasChangePermission = hasPermission('facilities', 'change');
  const hasDeletePermission = hasPermission('facilities', 'delete');
  
  const hasClosedFacilities = facilities.some(f => f.is_closed);

  // Определяем, нужно ли показывать столбец действий
  const shouldShowActions = hasChangePermission || hasDeletePermission || onLocate;

  const sortFacilitiesInGroup = (facilitiesList: Facility[]): Facility[] => {
    return [...facilitiesList].sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
  };

  const groupedData = facilities.reduce((acc, facility) => {
    if (!facility.division) {
      if (!acc.noDivision) {
        acc.noDivision = {
          groupName: 'Объекты без подразделения',
          groupOrder: -1,
          facilities: []
        };
      }
      acc.noDivision.facilities.push(facility);
    } else {
      const divisionId = facility.division.id;
      const divisionName = facility.division.name;
      const divisionOrder = facility.division.order || 9999;

      const subdivisionId = facility.subdivision?.id || 'no-subdivision';
      const subdivisionName = facility.subdivision?.name || 'Без отделения';
      const subdivisionOrder = facility.subdivision?.order || 9999;

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
          facilities: []
        };
      }

      acc.divisions[divisionId].subdivisions[subdivisionId].facilities.push(facility);
    }

    return acc;
  }, {
    noDivision: null as { groupName: string; groupOrder: number; facilities: Facility[] } | null,
    divisions: {} as Record<string, {
      divisionName: string;
      divisionOrder: number;
      subdivisions: Record<string, {
        subdivisionName: string;
        subdivisionOrder: number;
        facilities: Facility[];
      }>;
    }>
  });

  if (groupedData.noDivision) {
    groupedData.noDivision.facilities = sortFacilitiesInGroup(groupedData.noDivision.facilities);
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
      division.subdivisions[subdivisionId].facilities = sortFacilitiesInGroup(
        division.subdivisions[subdivisionId].facilities
      );
    });
  });

  const handleRowClick = (facility: Facility) => {
    const currentSearchParams = new URLSearchParams(window.location.search);

    const state: any = {
      from: 'facilities-section',
      divisionId: divisionId,
      subdivisionId: subdivisionId,
      activeTab: activeTab,
      filterType: filterType,
      facilityClassFilter: facilityClassFilter
    };

    let facilityUrl = `/facilities/${facility.id}`;
    const params = new URLSearchParams();

    const typeFilter = currentSearchParams.get('type');
    const classFilter = currentSearchParams.get('class');
    const viewFilter = currentSearchParams.get('view');

    if (typeFilter) {
      params.append('type', typeFilter);
    }
    if (classFilter) {
      params.append('class', classFilter);
    }
    if (viewFilter) {
      params.append('view', viewFilter);
    }

    const queryString = params.toString();
    if (queryString) {
      facilityUrl += `?${queryString}`;
    }

    navigate(facilityUrl, { state });
  };

  const renderRowContent = (facility: Facility) => {
    if (!showDifferentFields) {
      return (
        <>
          <td className="facility-table-cell facility-table-cell-primary">
            {facility.name}
          </td>
          <td className="facility-table-cell">
            {facility.type?.name || '-'}
          </td>
          {hasClosedFacilities && (
            <td className="facility-table-cell">
              {facility.is_closed ? `${facility.facility_class} класс` : '-'}
            </td>
          )}
          <td className="facility-table-cell">
            {facility.address}
          </td>
          <td className="facility-table-cell">
            <div className="facility-division-container">
              <div className="facility-division-name">
                {facility.division_name || '-'}
              </div>
              {facility.subdivision_name && (
                <div className="facility-subdivision-name">
                  {facility.subdivision_name}
                </div>
              )}
            </div>
          </td>
        </>
      );
    }

    return (
      <>
        <td className="facility-table-cell facility-table-cell-primary">
          {facility.name}
        </td>
        <td className="facility-table-cell">
          {facility.type?.name || '-'}
        </td>
        <td className="facility-table-cell">
          {facility.facility_class ? `${facility.facility_class} класс` : '-'}
        </td>
        <td className="facility-table-cell">
          {facility.communication_posts?.map(post => post.name).join(', ') || '-'}
        </td>
        <td className="facility-table-cell">
          {facility.address}
        </td>
        <td className="facility-table-cell">
          <div className="facility-division-container">
            <div className="facility-division-name">
              {facility.division_name || '-'}
            </div>
            {facility.subdivision_name && (
              <div className="facility-subdivision-name">
                {facility.subdivision_name}
              </div>
            )}
          </div>
        </td>
        <td className="facility-table-cell">
          {facility.inn || '-'}
        </td>
      </>
    );
  };

  const renderHeader = () => {
    const headers = [];

    if (!showDifferentFields) {
      headers.push(
        <th key="name" className="facility-table-header">Наименование</th>,
        <th key="type" className="facility-table-header">Тип</th>
      );
      
      if (hasClosedFacilities) {
        headers.push(<th key="class" className="facility-table-header">Класс</th>);
      }
      
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

    // Добавляем столбец "Действия" в renderHeader, если нужно
    if (shouldShowActions) {
      headers.push(
        <th key="actions" className="facility-table-header facility-table-cell-actions">
          Действия
        </th>
      );
    }

    return headers;
  };

  const getColspan = () => {
    let baseColspan = showDifferentFields ? 7 : (hasClosedFacilities ? 5 : 4);
    // Добавляем 1 если есть столбец действий
    return baseColspan + (shouldShowActions ? 1 : 0);
  };

  const renderActions = (facility: Facility) => {
    if (!shouldShowActions) return null;

    return (
      <td className="facility-table-cell facility-table-cell-actions">
        <div className="facility-action-buttons">
          {onLocate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLocate(facility);
              }}
              className="facility-locate-btn"
              aria-label="Найти на карте"
            >
              <LocateFixed className="h-4 w-4" />
            </button>
          )}
          {/* Показываем кнопку удаления только если есть право 'delete' */}
          {hasDeletePermission && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(facility.id);
              }}
              className="facility-delete-btn"
              aria-label="Удалить объект"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </td>
    );
  };

  return (
    <div className="facility-table-container">
      <table className="facility-table">
        <thead>
          <tr>
            {renderHeader()}
          </tr>
        </thead>
        <tbody>
          {groupedData.noDivision && (
            <React.Fragment>
              <tr className="division-header-row no-division-header">
                <td colSpan={getColspan()} className="facility-division-header-cell">
                  {groupedData.noDivision.groupName}
                </td>
              </tr>
              {groupedData.noDivision.facilities.map((facility) => (
                <tr
                  key={facility.id}
                  className="facility-table-row no-division-row"
                  onClick={() => handleRowClick(facility)}
                >
                  {renderRowContent(facility)}
                  {renderActions(facility)}
                </tr>
              ))}
            </React.Fragment>
          )}

          {sortedDivisionIds.map(divisionId => {
            const division = groupedData.divisions[divisionId];

            return (
              <React.Fragment key={divisionId}>
                <tr className="division-header-row">
                  <td colSpan={getColspan()} className="facility-division-header-cell">
                    {division.divisionName}
                  </td>
                </tr>

                {division.sortedSubdivisionIds.map(subdivisionId => {
                  const subdivision = division.subdivisions[subdivisionId];

                  return (
                    <React.Fragment key={subdivisionId}>
                      {subdivision.facilities.length > 0 && (
                        <tr className="subdivision-header-row">
                          <td colSpan={getColspan()} className="facility-subdivision-header-cell">
                            {subdivision.subdivisionName}
                          </td>
                        </tr>
                      )}

                      {subdivision.facilities.map((facility) => (
                        <tr
                          key={facility.id}
                          className="facility-table-row"
                          onClick={() => handleRowClick(facility)}
                        >
                          {renderRowContent(facility)}
                          {renderActions(facility)}
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