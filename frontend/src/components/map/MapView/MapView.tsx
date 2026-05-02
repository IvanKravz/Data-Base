// MapView.tsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import ObjectMarker from './ObjectMarker';
import './style.css';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { useDebounce } from '../../../utils/useDebounce';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

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
  const [foundLocation, setFoundLocation] = useState<[number, number] | null>(null);
  const [objects, setObjects] = useState<any[]>([]);
  const [initialPosition, setInitialPosition] = useState<{
    center: [number, number];
    zoom: number;
  } | null>(null);
  const popupRefs = useRef<{ [key: string]: L.Popup | null }>({});
  const mapRef = useRef<L.Map | null>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);

  const setPopupRef = useCallback((id: string, popup: L.Popup | null) => {
    popupRefs.current[id] = popup;
  }, []);

  // Преобразуем facilities в объекты карты, используя готовые координаты из БД
  useEffect(() => {
    if (!facilities.length) return;

    const validObjects = facilities
      .filter(f => f.latitude != null && f.longitude != null)
      .map(f => ({
        id: f.id,
        name: f.name,
        lat: f.latitude,
        lng: f.longitude,
        address: f.address || 'Адрес не указан',
        description: f.comments,
        type: f.type,
        facility_class: f.facility_class,
        is_closed: f.is_closed,
        type_display: f.type_display,
        color: f.is_closed ? 'grey' : 'blue'
      }));

    setObjects(validObjects);

    if (validObjects.length > 0) {
      const firstObject = validObjects[0];
      setInitialPosition({
        center: [firstObject.lat, firstObject.lng],
        zoom: 10
      });
    }
  }, [facilities]);

  // Поиск по объектам
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

  // Закрытие попапов
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