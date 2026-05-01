// MapView.tsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import ObjectMarker from './ObjectMarker';
import { geocodeAddress, loadGeoJSONData } from '../data/addresses';
import './style.css';

// Фикс для иконок маркеров
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { useDebounce } from '../../../utils/useDebounce';
import { useLocation } from 'react-router-dom';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Компонент для управления положением карты
const MapController = React.memo(({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
});

interface MapViewProps {
  facilities: any[];
  searchTerm?: string;
}

const MapView: React.FC<MapViewProps> = React.memo(({ facilities, searchTerm = '' }) => {
  const [geoDataLoaded, setGeoDataLoaded] = useState(false);
  const [foundLocation, setFoundLocation] = useState<[number, number] | null>(null);
  const [objects, setObjects] = useState<any[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [initialPosition, setInitialPosition] = useState<{
    center: [number, number];
    zoom: number;
  } | null>(null);
  const popupRefs = useRef<{ [key: string]: L.Popup | null }>({});
  const mapRef = useRef<L.Map | null>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const location = useLocation();

  const setPopupRef = useCallback((id: string, popup: L.Popup | null) => {
    popupRefs.current[id] = popup;
  }, []);

  // 1. Загружаем GeoJSON один раз при монтировании
  useEffect(() => {
    let isMounted = true;
    loadGeoJSONData().then(() => {
      if (isMounted) setGeoDataLoaded(true);
    });
    return () => { isMounted = false; };
  }, []);

  // 2. Обрабатываем facilities только после загрузки геоданных
  useEffect(() => {
    if (!geoDataLoaded || facilities.length === 0) return;

    let isMounted = true;

    const processFacilities = async () => {
      try {
        const processingPromises = facilities.map(async (facility) => {
          const geocoded = facility.address ? geocodeAddress(facility.address) : null;
          let lat = null;
          let lng = null;

          if (geocoded) {
            lat = Array.isArray(geocoded.lat) ? geocoded.lat[1] : geocoded.lat;
            lng = Array.isArray(geocoded.lng) ? geocoded.lng[0] : geocoded.lng;
          }

          if (lat && lng) {
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
          }
          return null;
        });

        const results = await Promise.all(processingPromises);
        const validObjects = results.filter(Boolean);

        if (isMounted) {
          setObjects(validObjects);

          if (validObjects.length > 0) {
            const objectWithMinId = validObjects.reduce((prev, current) =>
              (prev.id < current.id) ? prev : current
            );
            if (objectWithMinId.lat && objectWithMinId.lng) {
              setInitialPosition({
                center: [objectWithMinId.lat, objectWithMinId.lng],
                zoom: 10
              });
            }
          }
          setMapReady(true);
        }
      } catch (error) {
        console.error('Ошибка обработки объектов:', error);
        if (isMounted) setMapReady(true);
      }
    };

    processFacilities();

    return () => { isMounted = false; };
  }, [facilities, geoDataLoaded]);

  // Обработка поиска (без изменений)
  useEffect(() => {
    if (!debouncedSearchTerm || debouncedSearchTerm.trim() === '') {
      setSelectedObjectId(null);
      setFoundLocation(null);
      Object.values(popupRefs.current).forEach(popup => {
        if (popup && mapRef.current) {
          mapRef.current.closePopup(popup);
        }
      });
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
      setSelectedObjectId(foundObj.id);
      setFoundLocation([foundObj.lat, foundObj.lng]);
      setTimeout(() => {
        if (foundObj.id && popupRefs.current[foundObj.id]) {
          popupRefs.current[foundObj.id]?.openOn(mapRef.current);
        }
      }, 300);
    } else {
      setSelectedObjectId(null);
      setFoundLocation(null);
    }
  }, [debouncedSearchTerm, objects]);

  // Обработка закрытия попапов (без изменений)
  useEffect(() => {
    if (!mapRef.current) return;
    const handlePopupClose = (e: L.PopupEvent) => {
      const popupContent = e.popup.getContent();
      if (popupContent && typeof popupContent === 'string') {
        const parser = new DOMParser();
        const doc = parser.parseFromString(popupContent, 'text/html');
        const titleElement = doc.querySelector('h3.font-bold');
        if (titleElement) {
          const objectName = titleElement.textContent;
          const foundObject = objects.find(obj => obj.name === objectName);
          if (foundObject && foundObject.id === selectedObjectId) {
            setSelectedObjectId(null);
          }
        }
      }
    };
    mapRef.current.on('popupclose', handlePopupClose);
    return () => {
      if (mapRef.current) {
        mapRef.current.off('popupclose', handlePopupClose);
      }
    };
  }, [objects, selectedObjectId]);

  // Мемоизированные маркеры (без изменений)
  const renderMarkers = useMemo(() => {
    return objects
      .filter(obj => obj.lat !== null && obj.lng !== null)
      .map((obj) => (
        <ObjectMarker
          key={obj.id}
          object={obj}
          isSelected={selectedObjectId === obj.id}
          searchTerm={searchTerm}
          setPopupRef={setPopupRef}
        />
      ));
  }, [objects, selectedObjectId, searchTerm, setPopupRef]);

  return (
    <div className="map-page-container">
      <div className="map-header">
        <h1 className="map-title">Карта объектов</h1>
      </div>

      <div className="map-container">
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

          {renderMarkers}
        </MapContainer>
      </div>
    </div>
  );
});

export default MapView;