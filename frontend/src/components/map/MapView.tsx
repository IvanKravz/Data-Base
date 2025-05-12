// MapView.tsx
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import AddressSearch from './AddressSearch';
import ObjectMarker from './ObjectMarker';
import { MapObject } from './data/objects';
import { facilitiesApi } from '../../api/facilities';
import { loadGeoJSONData } from './data/addresses';
import './style.css';

// Фикс для иконок маркеров
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface MapViewProps {
  divisionId: string;
  divisionName: string;
}

const MapView: React.FC<MapViewProps> = ({ divisionId, divisionName }) => {
  const [foundLocation, setFoundLocation] = useState<[number, number] | null>(null);
  const [objects, setObjects] = useState<MapObject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Загружаем GeoJSON данные при монтировании
    loadGeoJSONData();

    const fetchFacilities = async () => {
      try {
        const facilities = await facilitiesApi.getFacilities({ 
          token: localStorage.getItem('accessToken') || '',
          division: divisionId 
        });
        
        const mappedObjects = facilities.map((facility: any) => ({
          id: facility.id,
          name: facility.name,
          lat: facility.lat || 48.4833,
          lng: facility.lng || 135.0667,
          address: facility.address || 'Адрес не указан',
          description: facility.comments,
          type: facility.type,
          facility_class: facility.facility_class,
          is_closed: facility.is_closed,
          color: facility.is_closed ? 'grey' : 'blue'
        }));
        
        setObjects(mappedObjects);
      } catch (error) {
        console.error('Ошибка загрузки объектов:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFacilities();
  }, [divisionId]);
  console.log('objects', objects)
  return (
    <div className="map-page-container">
      <div className="map-header">
        <h1 className="map-title">Карта объектов подразделения: {divisionName}</h1>
      </div>
      
      <div className="map-container">
        <AddressSearch onAddressFound={setFoundLocation} />
        
        <MapContainer
          center={[48.4833, 135.0667]}
          zoom={10}
          className="map"
          minZoom={5}
          maxZoom={14}
          attributionControl={false}
        >
          <TileLayer
            url="/tiles/{z}/{x}/{y}.png"
            attribution=''
            maxNativeZoom={14}
          />

          {objects.map((obj) => (
            <ObjectMarker key={obj.id} object={obj} />
          ))}

          {foundLocation && (
            <Marker position={foundLocation}>
              <Popup>Найденный объект</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapView;