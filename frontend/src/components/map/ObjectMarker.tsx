// ObjectMarker.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Marker, Popup } from 'react-leaflet';
import { MapObject } from './data/objects';
import L from 'leaflet';

const createCustomIcon = (color = 'blue', isSelected = false) => {


  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${isSelected ? 'red' : color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
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

  const handleNavigate = () => {
    navigate(`/facilities/${object.id}`);
  };

  return (
    <Marker
      position={[object.lat, object.lng]}
      icon={createCustomIcon(object.color || 'blue', isSelected)}
    >
      <Popup>
        <div className="popup-content">
          <h3 className="font-bold">{object.name}</h3>
          <p className="text-sm">{object.address}</p>
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