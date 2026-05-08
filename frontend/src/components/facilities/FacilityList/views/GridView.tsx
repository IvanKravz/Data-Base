// GridView.tsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import { Building2, MapPin, Shield, Star, Trash2, LocateFixed, ChevronDown, ChevronRight } from 'lucide-react';
import { Facility } from '../../../../types';
import './style.css';

interface GridViewProps {
  facilities: Facility[];
  onFacilityClick: (facility: Facility) => void;
  onDelete: (id: string) => void;
  onLocate: (facility: Facility) => void;
  divisionId?: string;
  subdivisionId?: string;
  activeTab?: string;
  filterType?: string | null;
  facilityClassFilter?: string | null;
}

export function GridView({
  facilities,
  onFacilityClick,
  onDelete,
  onLocate,
  divisionId,
  subdivisionId,
  activeTab,
  filterType,
  facilityClassFilter
}: GridViewProps) {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const permissions = user?.permissions;
  const hasDeletePermission = permissions?.models?.Facility?.includes('delete') ?? false;

  // Состояния сворачивания
  const [collapsedDivisions, setCollapsedDivisions] = useState<Set<string>>(new Set());
  const [collapsedSubdivisions, setCollapsedSubdivisions] = useState<Set<string>>(new Set());

  const sortFacilitiesInGroup = (list: Facility[]): Facility[] => {
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  };

  // Группировка объектов по подразделениям и отделениям
  const groupedData = facilities.reduce(
    (acc, facility) => {
      if (!facility.division) {
        if (!acc.noDivision) {
          acc.noDivision = { groupName: 'Объекты без подразделения', groupOrder: -1, facilities: [] };
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
          acc.divisions[divisionId] = { divisionName, divisionOrder, subdivisions: {} };
        }
        if (!acc.divisions[divisionId].subdivisions[subdivisionId]) {
          acc.divisions[divisionId].subdivisions[subdivisionId] = {
            subdivisionName,
            subdivisionOrder,
            facilities: [],
          };
        }
        acc.divisions[divisionId].subdivisions[subdivisionId].facilities.push(facility);
      }
      return acc;
    },
    {
      noDivision: null as { groupName: string; groupOrder: number; facilities: Facility[] } | null,
      divisions: {} as Record<
        string,
        {
          divisionName: string;
          divisionOrder: number;
          subdivisions: Record<
            string,
            { subdivisionName: string; subdivisionOrder: number; facilities: Facility[] }
          >;
          sortedSubdivisionIds?: string[];
        }
      >,
    }
  );

  // Сортировка внутри групп
  if (groupedData.noDivision) {
    groupedData.noDivision.facilities = sortFacilitiesInGroup(groupedData.noDivision.facilities);
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
      division.subdivisions[subId].facilities = sortFacilitiesInGroup(division.subdivisions[subId].facilities);
    });
  });

  // Функции сворачивания
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

  const handleCardClick = (facility: Facility) => {
    const currentSearchParams = new URLSearchParams(window.location.search);
    const state: any = {
      from: 'facilities-section',
      divisionId,
      subdivisionId,
      activeTab,
      filterType,
      facilityClassFilter,
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
  };

  // Рендер карточки объекта
  const renderFacilityCard = (facility: Facility) => (
    <div key={facility.id} className="facility-card-grid" onClick={() => handleCardClick(facility)}>
      <div className="facility-card-header">
        <h3 className="facility-card-title">
          {facility.name}
          <div className="facility-card-badge">{facility.type.name}</div>
        </h3>
        <div className="facility-card-actions">
          {onLocate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLocate(facility);
              }}
              className="facility-card-locate-btn"
              aria-label="Найти на карте"
            >
              <LocateFixed className="h-5 w-5" />
            </button>
          )}
          {hasDeletePermission && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(facility.id);
              }}
              className="facility-card-delete-btn"
              aria-label="Удалить объект"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
      <div className="facility-card-content">
        {facility.is_closed && (
          <div className="facility-card-item">
            <Star className="facility-card-icon" />
            <span>{facility.facility_class} класс</span>
          </div>
        )}
        <div className="facility-card-item">
          <MapPin className="facility-card-icon" />
          <span className="facility-card-text">{facility.address}</span>
        </div>
        <div className="facility-card-item">
          <Building2 className="facility-card-icon" />
          <span className="facility-card-text">
            {facility.division && !facility.subdivision && `${facility.division_name}`}
            {facility.subdivision && `${facility.division_name} / ${facility.subdivision_name}`}
          </span>
        </div>
        {facility.communication_posts.length >= 1 && (
          <div className="facility-card-item">
            <Shield className="facility-card-icon" />
            <span className="facility-card-text">
              {facility.communication_posts.map((post) => post.name).join(', ')}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="facility-grid-container">
      {/* Группа "без подразделения" */}
      {groupedData.noDivision && (
        <div className="facility-group">
          <div
            className="facility-group-header no-division-header"
            onClick={() => toggleDivision('no-division')}
            style={{ cursor: 'pointer' }}
          >
            <button
              className="collapse-button"
              onClick={(e) => {
                e.stopPropagation();
                toggleDivision('no-division');
              }}
            >
              {collapsedDivisions.has('no-division') ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
            </button>
            <span>{groupedData.noDivision.groupName}</span>
          </div>
          {!collapsedDivisions.has('no-division') && (
            <div className="facility-cards-wrapper">
              {groupedData.noDivision.facilities.map(renderFacilityCard)}
            </div>
          )}
        </div>
      )}

      {/* Подразделения */}
      {sortedDivisionIds.map((divisionId) => {
        const division = groupedData.divisions[divisionId];
        const isDivisionCollapsed = collapsedDivisions.has(divisionId);
        return (
          <div key={divisionId} className="facility-group">
            <div
              className="facility-group-header division-header-row"
              onClick={() => toggleDivision(divisionId)}
              style={{ cursor: 'pointer' }}
            >
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
            {!isDivisionCollapsed &&
              division.sortedSubdivisionIds!.map((subdivisionId) => {
                const subdivision = division.subdivisions[subdivisionId];
                const subKey = `${divisionId}-${subdivisionId}`;
                const isSubCollapsed = collapsedSubdivisions.has(subKey);
                const hasFacilities = subdivision.facilities.length > 0;
                return (
                  <div key={subdivisionId} className="facility-subgroup">
                    {hasFacilities && (
                      <div
                        className="facility-subgroup-header subdivision-header-row"
                        onClick={() => toggleSubdivision(divisionId, subdivisionId)}
                        style={{ cursor: 'pointer' }}
                      >
                        <button
                          className="collapse-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSubdivision(divisionId, subdivisionId);
                          }}
                        >
                          {isSubCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                        </button>
                        <span>{subdivision.subdivisionName}</span>
                      </div>
                    )}
                    {!isSubCollapsed && (
                      <div className="facility-cards-wrapper">
                        {subdivision.facilities.map(renderFacilityCard)}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        );
      })}
    </div>
  );
}