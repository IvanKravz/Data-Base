import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Marker, Popup } from 'react-leaflet';
import { MapObject } from './data/objects';
import L from 'leaflet';

// Импортируем локальные изображения
import blueIcon from '../../assets/markers/marker-icon-2x-blue.png';
import redIcon from '../../assets/markers/marker-icon-2x-red.png';
import grayIcon from '../../assets/markers/marker-icon-2x-grey.png';
import shadowIcon from '../../assets/markers/marker-shadow.png';

const createCustomIcon = (color = 'blue', isSelected = false, isClosed = false) => {
  let icon;
  
  if (isSelected) {
    icon = redIcon;
  } else if (isClosed) {
    icon = grayIcon;
  } else {
    switch(color) {
      case 'gray': icon = grayIcon; break;
      default: icon = blueIcon;
    }
  }
  
  return new L.Icon({
    iconUrl: icon,
    shadowUrl: shadowIcon,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

interface ObjectMarkerProps {
  object: MapObject;
  isSelected?: boolean;
}

const ObjectMarker: React.FC<ObjectMarkerProps> = ({ object, isSelected = false }) => {
  const navigate = useNavigate();

  if (!object.lat || !object.lng) {
    return null;
  }

  const handleNavigate = () => {
    navigate(`/facilities/${object.id}`);
  };

  return (
    <Marker
      position={[object.lat, object.lng]}
      icon={createCustomIcon(object.color || 'blue', isSelected, object.is_closed)}
    >
      <Popup>
        <div className="popup-content">
          <h3 className="font-bold">{object.name}</h3>
          <div className="map-text-type-display">
            {object.type_display}
            <span className="closed-badge"> {object.type.name}</span>
          </div>
          <div className="map-text-address">{object.address}</div>
          {object.description && (
            <p className="mt-1 text-xs">{object.description}</p>
          )}
          <button
            onClick={handleNavigate}
            className="navigate-button"
          >
            Перейти
          </button>
        </div>
      </Popup>
    </Marker>
  );
};

export default ObjectMarker;