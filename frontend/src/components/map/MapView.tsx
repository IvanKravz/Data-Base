// MapView.tsx
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import AddressSearch from './AddressSearch';
import ObjectMarker from './ObjectMarker';
import { facilitiesApi } from '../../api/facilities';
import { geoJSONData, geocodeAddress, loadGeoJSONData } from './data/addresses';
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
  const [loading, setLoading] = useState(true);
  const [initialCenter, setInitialCenter] = useState<[number, number]>([48.4833, 135.0667]); // Дефолтные координаты Хабаровска
  const [initialZoom, setInitialZoom] = useState(10);
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
            return {
              id: facility.id,
              name: facility.name,
              lat: geocoded?.lat || null,
              lng: geocoded?.lng || null,
              address: facility.address || 'Адрес не указан',
              description: facility.comments,
              type: facility.type,
              facility_class: facility.facility_class,
              is_closed: facility.is_closed,
              color: facility.is_closed ? 'grey' : 'blue'
            };
          }));

          if (isMounted && mappedObjects.length > 0) {
            setObjects(mappedObjects);
            // Устанавливаем позицию на первый объект
            setInitialPosition({
              center: [mappedObjects[0].lat, mappedObjects[0].lng],
              zoom: 10
            });
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
    // Найти объект по координатам или названию
    const foundObj = objects.find(obj =>
      (obj.lat === coords[0] && obj.lng === coords[1]) ||
      obj.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSelectedObject(foundObj || null);
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
        <AddressSearch onAddressFound={handleAddressFound} />

        <MapContainer
          center={initialPosition?.center || [48.4833, 135.0667]}
          zoom={initialPosition?.zoom || 10}
          className="map"
          minZoom={5}
          maxZoom={17}
          attributionControl={false}
        >
          {foundLocation && <MapController center={foundLocation} zoom={14} />}

          <TileLayer
            url="/tiles/{z}/{x}/{y}.webp"
            attribution=''
            maxNativeZoom={17}
            detectRetina={true}
            crossOrigin="anonymous"
            errorTileUrl="/error-tile.png"
          />

          {objects.map((obj) => (
            <ObjectMarker
              key={obj.id}
              object={obj}
              isSelected={selectedObject?.id === obj.id}
            />
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