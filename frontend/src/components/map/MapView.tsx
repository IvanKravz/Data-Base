// MapView.tsx
import React, { useState, useEffect, useRef } from 'react';
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
import { useDebounce } from '../../utils/useDebounce';

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
  subdivisionId: string | null;
  searchTerm?: string; // Добавляем пропс для поискового запроса
}

const MapView: React.FC<MapViewProps> = ({ divisionId, subdivisionId, searchTerm = '' }) => {
  const [foundLocation, setFoundLocation] = useState<[number, number] | null>(null);
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [objects, setObjects] = useState<any[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [initialPosition, setInitialPosition] = useState<{
    center: [number, number];
    zoom: number;
  } | null>(null);
  const popupRefs = useRef<{ [key: string]: L.Popup | null }>({});
  const setPopupRef = (id: string, popup: L.Popup | null) => {
    popupRefs.current[id] = popup;
  };
  const mapRef = useRef<L.Map | null>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);



  useEffect(() => {
    if (!debouncedSearchTerm || debouncedSearchTerm.trim() === '') {
      setSelectedObject(null);
      setFoundLocation(null);
      return;
    }

    const normalizedSearch = debouncedSearchTerm.toLowerCase()
      .replace(/,/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const foundObj = objects.find(obj => {
      const fullAddress = `${obj.address || ''}`.toLowerCase()
        .replace(/,/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      return fullAddress.includes(normalizedSearch) ||
        obj.name.toLowerCase().includes(normalizedSearch);
    });

    if (foundObj && foundObj.lat && foundObj.lng) {
      setSelectedObject(foundObj);
      setFoundLocation([foundObj.lat, foundObj.lng]);

      setTimeout(() => {
        if (foundObj.id && popupRefs.current[foundObj.id]) {
          popupRefs.current[foundObj.id]?.openOn(mapRef.current);
        }
      }, 300);
    } else {
      setSelectedObject(null);
      setFoundLocation(null);
    }
  }, [debouncedSearchTerm, objects]);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        await loadGeoJSONData();
        if (!isMounted) return;

        const facilities = await facilitiesApi.getFacilities({
          token: localStorage.getItem('accessToken') || '',
          division: divisionId,
          subdivision: subdivisionId || undefined
        });

        const mappedObjects = await Promise.all(
          facilities.map(async (facility) => {
            // Проверяем принадлежность к подразделению, если указано
            if (subdivisionId && facility.subdivision?.toString() !== subdivisionId) {
              return null;
            }

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
        ).then(results => results.filter(Boolean)); // Удаляем null значения

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
  }, [divisionId, subdivisionId]);

  if (!mapReady) {
    return <div className="loading-spinner">Загрузка карты...</div>;
  }

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

  if (objects.length === 0 && mapReady) {
    return (
      <div className="map-page-container">
        <div className="map-header">
          <h1 className="map-title">Карта объектов</h1>
        </div>
        <div className="no-objects-message">
          Нет объектов для отображения в выбранном подразделении
        </div>
      </div>
    );
  }

  return (
    <div className="map-page-container">
      <div className="map-header">
        <h1 className="map-title">Карта объектов</h1>
      </div>

      <div className="map-container">
        {/* <AddressSearch 
        onAddressFound={handleAddressFound} 
        onNameFound={handleNameFound} 
      /> */}

        <MapContainer
          ref={mapRef}
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
                searchTerm={searchTerm}
                setPopupRef={setPopupRef}
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