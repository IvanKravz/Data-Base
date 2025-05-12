// addresses.ts
interface GeocodeResult {
  lat: number;
  lng: number;
  address: string;
  name?: string;
}

let geoJSONData: any = null;

export async function loadGeoJSONData() {
  try {
    const response = await fetch('/map/coordinate.osm.json');
    geoJSONData = await response.json();
  } catch (error) {
    console.error('Ошибка загрузки GeoJSON:', error);
  }
}

function buildAddress(feature: any): string {
  const props = feature.properties || {};
  
  // Если есть полный адрес - используем его
  if (props['addr:full']) {
    return props['addr:full'];
  }

  // Собираем адрес из компонентов
  const addressParts = [
    props['addr:region'],
    props['addr:city'],
    props['addr:district'],
    props['addr:street'],
    props['addr:housenumber']
  ].filter(Boolean);

  // Если есть все компоненты - собираем в стандартный формат
  if (addressParts.length > 0) {
    // Формат: Город, улица, дом
    if (props['addr:city'] && props['addr:street'] && props['addr:housenumber']) {
      return `${props['addr:city']}, ${props['addr:street']}, ${props['addr:housenumber']}`;
    }
    // Иначе возвращаем все части через запятую
    return addressParts.join(', ');
  }

  // Если есть только название - используем его
  if (props.name) {
    return props.name;
  }

  return 'Адрес не указан';
}

export function geocodeAddress(query: string): GeocodeResult | null {
  if (!geoJSONData) {
    console.warn('GeoJSON данные не загружены');
    return null;
  }

  const normalizedQuery = query.toLowerCase().trim();

  const feature = geoJSONData.features.find((f: any) => {
    if (!f.properties) return false;
    
    // Проверяем все строковые свойства объекта
    return Object.entries(f.properties).some(([key, value]) => {
      // Игнорируем специальные OSM теги (начинающиеся с ':')
      if (key.startsWith(':')) return false;
      
      // Проверяем только строковые значения
      if (typeof value === 'string') {
        return value.toLowerCase().includes(normalizedQuery);
      }
      return false;
    });
  });

  if (!feature) return null;

  return {
    lat: feature.geometry.coordinates[1],
    lng: feature.geometry.coordinates[0],
    address: buildAddress(feature),
    name: feature.properties?.name || 'Объект'
  };
}