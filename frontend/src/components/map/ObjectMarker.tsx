import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { MapObject } from './data/objects';
import L from 'leaflet';

const createCustomIcon = (color = 'blue') => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

interface ObjectMarkerProps {
  object: MapObject;
}

const ObjectMarker: React.FC<ObjectMarkerProps> = ({ object }) => {
  return (
    <Marker 
      position={[object.lat, object.lng]} 
      icon={createCustomIcon(object.color || 'blue')}
    >
      <Popup>
        <div className="min-w-[200px]">
          <h3 className="font-bold">{object.name}</h3>
          <p className="text-sm">{object.address}</p>
          {object.description && (
            <p className="mt-1 text-xs">{object.description}</p>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

export default ObjectMarker;