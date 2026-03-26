import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import { Building2, MapPin, Shield, Star, Trash2, LocateFixed } from 'lucide-react';
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

  const handleCardClick = (facility: Facility) => {
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

    if (typeFilter) params.append('type', typeFilter);
    if (classFilter) params.append('class', classFilter);
    if (viewFilter) params.append('view', viewFilter);

    const queryString = params.toString();
    if (queryString) facilityUrl += `?${queryString}`;

    navigate(facilityUrl, { state });
  };

  return (
    <div className="facility-grid-container">
      {facilities.map((facility) => (
        <div key={facility.id} className="facility-card-grid" onClick={() => handleCardClick(facility)}>
          <div className="facility-card-header">
            <h3 className="facility-card-title">
              {facility.name}
              <div className="facility-card-badge">
                {facility.type.name}
              </div>
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
                <span className="facility-card-text">{facility.communication_posts?.map(post => post.name).join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}