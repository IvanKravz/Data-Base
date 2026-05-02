// addresses.ts
interface GeocodeResult {
  lat: number;
  lng: number;
  address: string;
  name?: string;
}

export let geoJSONData: any = null;
const SEARCH_CACHE_KEY = 'addressSearchCache';

let searchCache: Record<string, GeocodeResult> = {};

try {
  const cachedData = localStorage.getItem(SEARCH_CACHE_KEY);
  if (cachedData) {
    searchCache = JSON.parse(cachedData);
  }
} catch (error) {
  console.warn('Не удалось загрузить кэш поиска:', error);
}

// Индексы для быстрого поиска
let nameIndex: Map<string, any> = new Map();
let cityIndex: Map<string, any[]> = new Map();
let streetIndex: Map<string, any[]> = new Map();

function buildIndexes() {
  if (!geoJSONData || !geoJSONData.features) return;

  nameIndex.clear();
  cityIndex.clear();
  streetIndex.clear();

  for (const feature of geoJSONData.features) {
    const props = feature.properties;
    if (!props) continue;

    // Индекс по имени
    if (props.name) {
      const normalizedName = normalizeAddress(props.name);
      nameIndex.set(normalizedName, feature);
    }

    // Индекс по городу
    const city = props['addr:city'];
    if (city) {
      const normalizedCity = normalizeCity(city);
      if (!cityIndex.has(normalizedCity)) cityIndex.set(normalizedCity, []);
      cityIndex.get(normalizedCity)!.push(feature);
    }

    // Индекс по улице
    const street = props['addr:street'];
    if (street) {
      const normalizedStreet = normalizeStreet(street);
      if (!streetIndex.has(normalizedStreet)) streetIndex.set(normalizedStreet, []);
      streetIndex.get(normalizedStreet)!.push(feature);
    }
  }
}

export async function loadGeoJSONData() {
  try {
    const response = await fetch('/map/coordinate.osm.json');
    geoJSONData = await response.json();
    buildIndexes(); // построить индексы после загрузки
  } catch (error) {
    console.error('Ошибка загрузки GeoJSON:', error);
  }
}

// Нормализация названия города: удаляем "г. " в начале
function normalizeCity(city: string): string {
  return city
    .toLowerCase()
    .replace(/^г\.\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Нормализация названия улицы: удаляем "ул. ", "улица" в начале
function normalizeStreet(street: string): string {
  return street
    .toLowerCase()
    .replace(/^(ул\.|улица)\s*/i, '')
    .replace(/[.,]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Общая нормализация адресной строки: удаляем "г. ", "ул. ", "улица"
function normalizeAddress(addr: string): string {
  return addr
    .toLowerCase()
    .replace(/^г\.\s*/i, '')
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
  const parts = query.split(',').map(part => part.trim());
  
  if (parts.length === 1) {
    return { city: parts[0] };
  }
  
  const knownCities = ['Аргунское', 'Покровка'];
  const potentialCity = parts[0];
  if (knownCities.includes(potentialCity)) {
    if (parts.length === 2) return { city: parts[0], street: parts[1] };
    if (parts.length === 3) return { city: parts[0], street: parts[1], housenumber: parts[2] };
  }
  
  if (parts.length === 3) {
    return { city: parts[0], street: parts[1], housenumber: parts[2] };
  } else if (parts.length === 2) {
    if (/\d/.test(parts[1])) {
      return { street: parts[0], housenumber: parts[1] };
    } else {
      return { city: parts[0], street: parts[1] };
    }
  }
  
  return { street: normalizeAddress(query) };
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
  const cachedResult = searchCache[query];
  if (cachedResult) return cachedResult;

  if (!geoJSONData) {
    console.warn('GeoJSON данные не загружены');
    return null;
  }

  const normalizedQuery = normalizeAddress(query);

  // 1. Поиск по имени через индекс
  const nameMatchFeature = nameIndex.get(normalizedQuery);
  if (nameMatchFeature) {
    const coords = getCoordinates(nameMatchFeature.geometry);
    const result = {
      lat: coords.lat,
      lng: coords.lng,
      address: formatAddress(nameMatchFeature.properties),
      name: nameMatchFeature.properties?.name
    };
    saveToCache(query, result);
    return result;
  }

  const searchAddr = buildSearchAddress(query);
  let filteredFeatures: any[] = [];

  if (searchAddr.city) {
    const normalizedCity = normalizeCity(searchAddr.city);
    filteredFeatures = cityIndex.get(normalizedCity) || [];
  } else {
    filteredFeatures = geoJSONData.features;
  }

  const createResult = (feature: any, address: string, name: string) => {
    const coords = getCoordinates(feature.geometry);
    if (typeof coords.lat !== 'number' || typeof coords.lng !== 'number') return null;
    const result = { lat: coords.lat, lng: coords.lng, address, name };
    saveToCache(query, result);
    return result;
  };

  // 2. Поиск по улице + дому
  if (searchAddr.street && searchAddr.housenumber) {
    const normalizedStreet = normalizeStreet(searchAddr.street);
    const normalizedHousenumber = normalizeAddress(searchAddr.housenumber);
    const streetFeatures = streetIndex.get(normalizedStreet) || [];
    const exactMatch = streetFeatures.find(f => {
      const props = f.properties;
      const featureHousenumber = normalizeAddress(props['addr:housenumber'] || '');
      return featureHousenumber === normalizedHousenumber;
    });
    if (exactMatch) {
      const result = createResult(exactMatch, formatAddress(exactMatch.properties), exactMatch.properties?.name || 'Объект');
      if (result) return result;
    }
  }

  // 3. Поиск только по улице
  if (searchAddr.street) {
    const normalizedStreet = normalizeStreet(searchAddr.street);
    const streetFeatures = streetIndex.get(normalizedStreet) || [];
    if (streetFeatures.length > 0) {
      const streetMatch = streetFeatures[0];
      const result = createResult(streetMatch, formatAddress(streetMatch.properties), streetMatch.properties?.name || searchAddr.street);
      if (result) return result;
    }
  }

  // 4. Если есть город, берём первый объект из списка города
  if (searchAddr.city && filteredFeatures.length > 0) {
    const cityFeature = filteredFeatures[0];
    const result = createResult(cityFeature, searchAddr.city, cityFeature.properties?.name || searchAddr.city);
    if (result) return result;
  }

  return null;
}

function getCoordinates(geometry: any): { lat: number; lng: number } {
  if (geometry && typeof geometry.lat === 'number' && typeof geometry.lng === 'number') {
    return { lat: geometry.lat, lng: geometry.lng };
  }
  if (!geometry || !geometry.coordinates) return { lat: 0, lng: 0 };
  if (Array.isArray(geometry.coordinates) && geometry.coordinates.length >= 2) {
    if (typeof geometry.coordinates[0] === 'number' && typeof geometry.coordinates[1] === 'number') {
      return { lat: geometry.coordinates[1], lng: geometry.coordinates[0] };
    }
    if (Array.isArray(geometry.coordinates[0]) && geometry.coordinates[0].length >= 2) {
      return { lat: geometry.coordinates[0][1], lng: geometry.coordinates[0][0] };
    }
  }
  if (geometry.type === 'LineString' && Array.isArray(geometry.coordinates) && geometry.coordinates.length > 0) {
    const firstPoint = geometry.coordinates[0];
    if (Array.isArray(firstPoint) && firstPoint.length >= 2) {
      return { lat: firstPoint[1], lng: firstPoint[0] };
    }
  }
  if (geometry.type === 'Polygon' && Array.isArray(geometry.coordinates) && geometry.coordinates.length > 0) {
    const firstRing = geometry.coordinates[0];
    if (Array.isArray(firstRing) && firstRing.length > 0) {
      const firstPoint = firstRing[0];
      if (Array.isArray(firstPoint) && firstPoint.length >= 2) {
        return { lat: firstPoint[1], lng: firstPoint[0] };
      }
    }
  }
  return { lat: 0, lng: 0 };
}

function formatAddress(props: any): string {
  const city = props['addr:city'] || '';
  const street = props['addr:street'] || '';
  const housenumber = props['addr:housenumber'] || '';
  if (city && !street && !housenumber) return city;
  return [city, street, housenumber].filter(part => part).join(', ').trim();
}