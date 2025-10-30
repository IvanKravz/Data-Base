import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Facility } from '../../../../types';
import { Trash2, LocateFixed } from 'lucide-react';
import './style.css';

interface TableViewProps {
  facilities: Facility[];
  onDelete: (id: string) => void;
  onLocate?: (facility: Facility) => void;
  showDifferentFields?: boolean;
  divisionId?: string; // Добавляем новые пропсы
  subdivisionId?: string;
  activeTab?: string;
}

export function TableView({
  facilities,
  onDelete,
  onLocate,
  showDifferentFields = false,
  divisionId,
  subdivisionId,
  activeTab
}: TableViewProps) {
  const navigate = useNavigate();
  const hasClosedFacilities = facilities.some(f => f.is_closed);

  // Функция для сортировки объектов внутри групп
  const sortFacilitiesInGroup = (facilitiesList: Facility[]): Facility[] => {
    return [...facilitiesList].sort((a, b) => {
      // Сортируем по названию
      return a.name.localeCompare(b.name);
    });
  };

  // Группируем объекты по подразделениям и отделениям
  const groupedData = facilities.reduce((acc, facility) => {
    // Объекты без подразделения идут в отдельную группу
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

  // Сортируем объекты внутри групп
  if (groupedData.noDivision) {
    groupedData.noDivision.facilities = sortFacilitiesInGroup(groupedData.noDivision.facilities);
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
    // Сохраняем отсортированный массив отделений в подразделении
    division.sortedSubdivisionIds = subdivisionIds;

    // Сортируем объекты внутри каждого отделения
    subdivisionIds.forEach(subdivisionId => {
      division.subdivisions[subdivisionId].facilities = sortFacilitiesInGroup(
        division.subdivisions[subdivisionId].facilities
      );
    });
  });

  const handleRowClick = (facility: Facility) => {
    navigate(`/facilities/${facility.id}`, {
      state: {
        from: 'facilities-section',
        divisionId: divisionId,
        subdivisionId: subdivisionId,
        activeTab: activeTab
      }
    });
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
            {facility.division_name} {facility.subdivision_name && `/ ${facility.subdivision_name}`}
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
          {facility.division_name} {facility.subdivision_name && `/ ${facility.subdivision_name}`}
        </td>
        <td className="facility-table-cell">
          {facility.inn || '-'}
        </td>
      </>
    );
  };

  const renderHeader = () => {
    if (!showDifferentFields) {
      return (
        <>
          <th className="facility-table-header">Наименование</th>
          <th className="facility-table-header">Тип</th>
          {hasClosedFacilities && <th className="facility-table-header">Класс</th>}
          <th className="facility-table-header">Адрес</th>
          <th className="facility-table-header">Подразделение</th>
        </>
      );
    }

    return (
      <>
        <th className="facility-table-header">Наименование</th>
        <th className="facility-table-header">Тип</th>
        <th className="facility-table-header">Класс</th>
        <th className="facility-table-header">Посты связи</th>
        <th className="facility-table-header">Адрес</th>
        <th className="facility-table-header">Подразделение</th>
        <th className="facility-table-header">ИНН</th>
      </>
    );
  };

  // Рассчитываем количество колонок для colspan
  const getColspan = () => {
    if (showDifferentFields) return 8;
    return hasClosedFacilities ? 6 : 5;
  };

  return (
    <div className="facility-table-container">
      <table className="facility-table">
        <thead>
          <tr>
            {renderHeader()}
            <th className="facility-table-header facility-table-cell-actions">
              Действия
            </th>
          </tr>
        </thead>
        <tbody>
          {/* Сначала отображаем объекты без подразделения */}
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
                    </div>
                  </td>
                </tr>
              ))}
            </React.Fragment>
          )}

          {/* Затем отображаем подразделения с отделениями */}
          {sortedDivisionIds.map(divisionId => {
            const division = groupedData.divisions[divisionId];

            return (
              <React.Fragment key={divisionId}>
                {/* Заголовок подразделения */}
                <tr className="division-header-row">
                  <td colSpan={getColspan()} className="facility-division-header-cell">
                    {division.divisionName}
                  </td>
                </tr>

                {/* Отделения внутри подразделения */}
                {division.sortedSubdivisionIds.map(subdivisionId => {
                  const subdivision = division.subdivisions[subdivisionId];

                  return (
                    <React.Fragment key={subdivisionId}>
                      {/* Заголовок отделения (если есть объекты) */}
                      {subdivision.facilities.length > 0 && (
                        <tr className="subdivision-header-row">
                          <td colSpan={getColspan()} className="facility-subdivision-header-cell">
                            {subdivision.subdivisionName}
                          </td>
                        </tr>
                      )}

                      {/* Объекты отделения */}
                      {subdivision.facilities.map((facility) => (
                        <tr
                          key={facility.id}
                          className="facility-table-row"
                          onClick={() => handleRowClick(facility)}
                        >
                          {renderRowContent(facility)}
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
                            </div>
                          </td>
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