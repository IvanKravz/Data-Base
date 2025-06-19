// MapView.tsx
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import AddressSearch from './AddressSearch';
import ObjectMarker from './ObjectMarker';
import { facilitiesApi } from '../../api/facilities';
import { geocodeAddress, loadGeoJSONData } from './data/addresses';
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

// Компонент для управления положением карты
const MapController = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

interface MapViewProps {
  divisionId: string;
}

const MapView: React.FC<MapViewProps> = ({ divisionId }) => {
  const [foundLocation, setFoundLocation] = useState<[number, number] | null>(null);
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [objects, setObjects] = useState<any[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [initialPosition, setInitialPosition] = useState<{
    center: [number, number];
    zoom: number;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
  
    const fetchData = async () => {
      try {
        await loadGeoJSONData();
        if (!isMounted) return;
  
        const facilities = await facilitiesApi.getFacilities({
          token: localStorage.getItem('accessToken') || '',
          division: divisionId
        });
  
        const mappedObjects = await Promise.all(
          facilities.map(async (facility) => {
            const geocoded = facility.address ? geocodeAddress(facility.address) : null;
            let lat = null;
            let lng = null;
  
            if (geocoded) {
              lat = Array.isArray(geocoded.lat) ? geocoded.lat[1] : geocoded.lat;
              lng = Array.isArray(geocoded.lng) ? geocoded.lng[0] : geocoded.lng;
            }
  
            return {
              id: facility.id,
              name: facility.name,
              lat: lat,
              lng: lng,
              address: facility.address || 'Адрес не указан',
              description: facility.comments,
              type: facility.type,
              facility_class: facility.facility_class,
              is_closed: facility.is_closed,
              type_display: facility.type_display,
              color: facility.is_closed ? 'grey' : 'blue'
            };
          })
        );
  
        if (isMounted && mappedObjects.length > 0) {
          setObjects(mappedObjects);
          
          // Находим объект с наименьшим ID
          const objectWithMinId = mappedObjects.reduce((prev, current) => 
            (prev.id < current.id) ? prev : current
          );
  
          // Устанавливаем позицию на объект с наименьшим ID
          if (objectWithMinId.lat && objectWithMinId.lng) {
            setInitialPosition({
              center: [objectWithMinId.lat, objectWithMinId.lng],
              zoom: 10
            });
          }
        }
        setMapReady(true);
      } catch (error) {
        console.error('Ошибка загрузки:', error);
      }
    };
  
    fetchData();
    return () => { isMounted = false; };
  }, [divisionId]);

  if (!mapReady) {
    return <div className="loading-spinner">Загрузка карты...</div>;
  }

  const handleAddressFound = (coords: [number, number]) => {
    setFoundLocation(coords);
    // Найти объект по координатам
    const foundObj = objects.find(obj =>
      obj.lat === coords[0] && obj.lng === coords[1]
    );
    setSelectedObject(foundObj || null);
  };

  const handleNameFound = (name: string) => {
    // Ищем объект по точному или частичному совпадению имени
    const foundObj = objects.find(obj => 
      obj.name.toLowerCase().includes(name.toLowerCase())
    );
    
    if (foundObj) {
      setSelectedObject(foundObj);
      if (foundObj.lat && foundObj.lng) {
        setFoundLocation([foundObj.lat, foundObj.lng]);
      }
    } else {
      // Если не нашли по имени, пробуем найти в geoJSON данных
      const geoResult = geocodeAddress(name);
      if (geoResult) {
        setFoundLocation([geoResult.lat, geoResult.lng]);
      }
    }
  };

  // Создаем кастомную иконку для найденного объекта
  const foundIcon = new L.DivIcon({
    className: 'found-marker',
    html: `
      <div class="found-marker-container">
        <div class="found-marker-pin"></div>
        <div class="found-marker-pulse"></div>
      </div>
    `,
    iconSize: [30, 42],
    iconAnchor: [15, 42]
  });

  return (
    <div className="map-page-container">
      <div className="map-header">
        <h1 className="map-title">Карта объектов</h1>
      </div>

      <div className="map-container">
      <AddressSearch 
        onAddressFound={handleAddressFound} 
        onNameFound={handleNameFound} 
      />

        <MapContainer
          center={initialPosition?.center || [48.4833, 135.0667]}
          zoom={initialPosition?.zoom || 10}
          className="map"
          minZoom={5}
          maxZoom={16}
          attributionControl={false}
        >
          {foundLocation && <MapController center={foundLocation} zoom={12} />}

          <TileLayer
            url="/tiles/{z}/{x}/{y}.webp"
            attribution=''
            maxNativeZoom={16}
            detectRetina={true}
            crossOrigin="anonymous"
            errorTileUrl="/error-tile.png"
          />

          {objects.map((obj) => (
            obj.lat !== null && obj.lng !== null && (
              <ObjectMarker
                key={obj.id}
                object={obj}
                isSelected={selectedObject?.id === obj.id}
              />
            )
          ))}

          {foundLocation && !selectedObject && (
            <Marker position={foundLocation} icon={foundIcon}>
              <Popup>Найденный адрес</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapView;