import React, { useRef } from 'react';
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
    switch (color) {
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
  searchTerm?: string;
  setPopupRef?: (id: string, popup: L.Popup | null) => void;
}

const ObjectMarker: React.FC<ObjectMarkerProps> = ({
  object,
  isSelected = false,
  searchTerm = '',
  setPopupRef
}) => {
  const navigate = useNavigate();
  const popupRef = useRef<L.Popup | null>(null);

  if (!object.lat || !object.lng) {
    return null;
  }

  const highlightText = (text: string = '', term: string = '') => {
    if (!term || !text) return text;
    try {
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedTerm})`, 'gi');
      return text.split(regex).map((part, i) =>
        regex.test(part)
          ? <span key={i} className="search-highlight">{part}</span>
          : part
      );
    } catch (e) {
      console.error('Error in highlightText:', e);
      return text;
    }
  };

  const handleNavigate = () => {
    navigate(`/facilities/${object.id}`);
  };

  return (
    <Marker
      position={[object.lat, object.lng]}
      icon={createCustomIcon(object.color || 'blue', isSelected, object.is_closed)}
      className={isSelected ? 'selected-marker' : ''}
    >
      <Popup
        ref={(popup) => {
          popupRef.current = popup;
          setPopupRef && setPopupRef(object.id, popup);
        }}
        className={isSelected ? 'leaflet-popup-auto' : ''}
      >
        <div className="popup-content">
          <h3 className="font-bold">{highlightText(object.name, searchTerm)}</h3>
          <div className="map-text-address">{highlightText(object.address, searchTerm)}</div>
          {object.description && (
            <p className="mt-1 text-xs">{highlightText(object.description, searchTerm)}</p>
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