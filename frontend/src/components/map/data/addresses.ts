// addresses.ts
interface GeocodeResult {
  lat: number;
  lng: number;
  address: string;
  name?: string;
}

export let geoJSONData: any = null;
const SEARCH_CACHE_KEY = 'addressSearchCache';

// Загружаем кэш при инициализации
let searchCache: Record<string, GeocodeResult> = {};

try {
  const cachedData = localStorage.getItem(SEARCH_CACHE_KEY);
  if (cachedData) {
    searchCache = JSON.parse(cachedData);
  }
} catch (error) {
  console.warn('Не удалось загрузить кэш поиска:', error);
}

export async function loadGeoJSONData() {
  try {
    const response = await fetch('/map/coordinate.osm.json');
    geoJSONData = await response.json();
  } catch (error) {
    console.error('Ошибка загрузки GeoJSON:', error);
  }
}

function normalizeStreetName(street: string): string {
  if (!street) return '';
  
  return street
    .toLowerCase()
    .replace(/(улица|ул\.?)\s*/g, '')
    .replace(/[.,]/g, '')
    .trim();
}

function normalizeAddress(addr: string): string {
  return addr
    .toLowerCase()
    .replace(/(улица|ул\.?)\s*/g, '')
    .replace(/[.,]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildSearchAddress(query: string): {
  city?: string;
  street?: string;
  housenumber?: string;
} {
  const normalizedQuery = normalizeAddress(query);
  const parts = query.split(',').map(part => part.trim());
  console.log('parts', parts)
  
  if (parts.length === 3) {
    return {
      city: parts[0],
      street: parts[1],
      housenumber: parts[2]
    };
  } else if (parts.length === 2) {
    if (/\d/.test(parts[1])) {
      return {
        street: parts[0],
        housenumber: parts[1]
      };
    } else {
      return {
        city: parts[0],
        street: parts[1]
      };
    }
  }
  
  return { street: normalizedQuery };
}

function saveToCache(query: string, result: GeocodeResult) {
  try {
    searchCache[query] = result;
    localStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify(searchCache));
  } catch (error) {
    console.warn('Не удалось сохранить в кэш:', error);
  }
}

export function geocodeAddress(query: string): GeocodeResult | null {
  // Проверяем кэш перед поиском
  const cachedResult = searchCache[query];
  if (cachedResult) {
    return cachedResult;
  }

  if (!geoJSONData) {
    console.warn('GeoJSON данные не загружены');
    return null;
  }

  const searchAddr = buildSearchAddress(query);

  // Ищем точное совпадение
  const exactMatch = geoJSONData.features.find((f: any) => {
    if (!f.properties) return false;
    
    const props = f.properties;
    const featureCity = normalizeAddress(props['addr:city'] || '');
    const featureStreet = normalizeStreetName(props['addr:street'] || '');
    const featureHousenumber = normalizeAddress(props['addr:housenumber'] || '');
    
    const cityMatch = !searchAddr.city || 
      featureCity === normalizeAddress(searchAddr.city);
    const streetMatch = !searchAddr.street || 
      featureStreet === normalizeStreetName(searchAddr.street);
    const housenumberMatch = !searchAddr.housenumber || 
      featureHousenumber === normalizeAddress(searchAddr.housenumber);

    return cityMatch && streetMatch && housenumberMatch;
  });

  if (exactMatch) {
    const coords = getCoordinates(exactMatch.geometry);
    const result = {
      lat: coords.lat[1],
      lng: coords.lng[0],
      address: formatAddress(exactMatch.properties),
      name: exactMatch.properties?.name || 'Объект'
    };
    saveToCache(query, result);
    return result;
  }

  // Ищем частичное совпадение
  const partialMatch = geoJSONData.features.find((f: any) => {
    if (!f.properties || !searchAddr.street) return false;
    
    const props = f.properties;
    const featureStreet = normalizeStreetName(props['addr:street'] || '');
    const searchStreet = normalizeStreetName(searchAddr.street);
    
    return featureStreet.includes(searchStreet) || 
      searchStreet.includes(featureStreet);
  });

  if (partialMatch) {
    const coords = getCoordinates(partialMatch.geometry);
    const result = {
      lat: coords.lat,
      lng: coords.lng,
      address: formatAddress(partialMatch.properties),
      name: partialMatch.properties?.name || 'Объект'
    };
    saveToCache(query, result);
    return result;
  }

  return null;
}

// Вспомогательные функции
function getCoordinates(geometry: any): { lat: number; lng: number } {
  if (geometry.type === 'LineString') {
    const [lng, lat] = geometry.coordinates[0];
    return { lat, lng };
  }
  const [lng, lat] = geometry.coordinates;
  return { lat, lng };
}

function formatAddress(props: any): string {
  const city = props['addr:city'] || '';
  const street = props['addr:street'] || '';
  const housenumber = props['addr:housenumber'] || '';
  
  return [city, street, housenumber]
    .filter(part => part)
    .join(', ')
    .trim();
}