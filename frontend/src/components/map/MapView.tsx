// MapView.tsx
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import AddressSearch from './AddressSearch';
import ObjectMarker from './ObjectMarker';
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
  facilities: any[];
  searchTerm?: string;
}

const MapView: React.FC<MapViewProps> = ({ facilities, searchTerm = '' }) => {
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

  const setPopupRef = (id: string, popup: L.Popup | null) => {
    popupRefs.current[id] = popup;
  };

  useEffect(() => {
    if (!debouncedSearchTerm || debouncedSearchTerm.trim() === '') {
      setSelectedObjectId(null);
      setFoundLocation(null);

      // Закрываем все открытые попапы при сбросе поиска
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

  useEffect(() => {
    let isMounted = true;

    const processFacilities = async () => {
      try {
        await loadGeoJSONData();
        if (!isMounted) return;

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
        ).then(results => results.filter(Boolean));

        if (isMounted) {
          setObjects(mappedObjects);

          if (mappedObjects.length > 0) {
            const objectWithMinId = mappedObjects.reduce((prev, current) =>
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
      }
    };

    processFacilities();
    return () => { isMounted = false; };
  }, [facilities]);

  if (!mapReady) {
    return <div className="loading-spinner">Загрузка карта...</div>;
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
          Нет объектов для отображения
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
                isSelected={selectedObjectId === obj.id}
                searchTerm={searchTerm}
                setPopupRef={setPopupRef}
              />
            )
          ))}

        </MapContainer>
      </div>
    </div>
  );
};

export default MapView;