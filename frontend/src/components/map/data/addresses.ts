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
  const normalizedQuery = normalizeAddress(query);
  const parts = query.split(',').map(part => part.trim());
  
  // Если запрос состоит из одного слова - считаем это городом
  if (parts.length === 1) {
    return {
      city: parts[0]
    };
  }
  
  // Если запрос начинается с известного города, считаем это городом
  const knownCities = ['Аргунское', 'Покровка']; // Добавьте другие известные города
  const potentialCity = parts[0];
  if (knownCities.includes(potentialCity)) {
    if (parts.length === 2) {
      return {
        city: parts[0],
        street: parts[1]
      };
    }
    if (parts.length === 3) {
      return {
        city: parts[0],
        street: parts[1],
        housenumber: parts[2]
      };
    }
  }
  
  // Общий случай для других запросов
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

  // Нормализуем поисковый запрос для сравнения
  const normalizedQuery = normalizeAddress(query);

  // Сначала попробуем найти объект по точному совпадению имени (нормализованному)
  const nameMatch = geoJSONData.features.find((f: any) => {
    const props = f.properties;
    const featureName = props?.name || '';
    return normalizeAddress(featureName) === normalizedQuery;
  });

  if (nameMatch) {
    const coords = getCoordinates(nameMatch.geometry);
    const result = {
      lat: coords.lat,
      lng: coords.lng,
      address: formatAddress(nameMatch.properties),
      name: nameMatch.properties?.name
    };
    saveToCache(query, result);
    return result;
  }

  const searchAddr = buildSearchAddress(query);

  // 1. Если указан город, сначала фильтруем объекты по городу (нормализованному)
  let filteredFeatures = geoJSONData.features;
  if (searchAddr.city) {
    const normalizedCity = normalizeCity(searchAddr.city);
    filteredFeatures = filteredFeatures.filter((f: any) => {
      if (!f.properties) return false;
      const featureCity = f.properties['addr:city'] || '';
      return normalizeCity(featureCity) === normalizedCity;
    });
  }

  // Функция для создания результата с проверкой координат
  const createResult = (feature: any, address: string, name: string) => {
    const coords = getCoordinates(feature.geometry);
    // Проверяем, что координаты валидны
    if (typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
      return null;
    }
    const result = {
      lat: coords.lat,
      lng: coords.lng,
      address,
      name
    };
    saveToCache(query, result);
    return result;
  };

  // 2. Ищем точное совпадение по улице и дому (если указаны)
  if (searchAddr.street && searchAddr.housenumber) {
    const normalizedStreet = normalizeStreet(searchAddr.street);
    const normalizedHousenumber = normalizeAddress(searchAddr.housenumber);
    const exactMatch = filteredFeatures.find((f: any) => {
      const props = f.properties;
      const featureStreet = normalizeStreet(props['addr:street'] || '');
      const featureHousenumber = normalizeAddress(props['addr:housenumber'] || '');
      return featureStreet === normalizedStreet &&
             featureHousenumber === normalizedHousenumber;
    });

    if (exactMatch) {
      const result = createResult(
        exactMatch,
        formatAddress(exactMatch.properties),
        exactMatch.properties?.name || 'Объект'
      );
      if (result) return result;
    }
  }

  // 3. Ищем только по улице (если указана)
  if (searchAddr.street) {
    const normalizedStreet = normalizeStreet(searchAddr.street);
    const streetMatch = filteredFeatures.find((f: any) => {
      const props = f.properties;
      const featureStreet = normalizeStreet(props['addr:street'] || '');
      return featureStreet === normalizedStreet;
    });

    if (streetMatch) {
      const result = createResult(
        streetMatch,
        formatAddress(streetMatch.properties),
        streetMatch.properties?.name || searchAddr.street
      );
      if (result) return result;
    }
  }

  // 4. Если ничего не найдено, но есть город - возвращаем координаты города
  if (searchAddr.city && filteredFeatures.length > 0) {
    const cityFeature = filteredFeatures[0];
    const result = createResult(
      cityFeature,
      searchAddr.city,
      cityFeature.properties?.name || searchAddr.city
    );
    if (result) return result;
  }

  return null;
}

// Вспомогательные функции
function getCoordinates(geometry: any): { lat: number; lng: number } {
  // Если geometry уже содержит нужные поля
  if (geometry && typeof geometry.lat === 'number' && typeof geometry.lng === 'number') {
    return { lat: geometry.lat, lng: geometry.lng };
  }

  // Если geometry не определена или нет coordinates
  if (!geometry || !geometry.coordinates) {
    return { lat: 0, lng: 0 };
  }

  // Если coordinates - это простой массив [lng, lat]
  if (Array.isArray(geometry.coordinates) && geometry.coordinates.length >= 2) {
    // Проверяем, что элементы массива - числа
    if (typeof geometry.coordinates[0] === 'number' && 
        typeof geometry.coordinates[1] === 'number') {
      return { 
        lat: geometry.coordinates[1], 
        lng: geometry.coordinates[0] 
      };
    }
    
    // Если это массив массивов [[lng, lat]]
    if (Array.isArray(geometry.coordinates[0]) && 
        geometry.coordinates[0].length >= 2) {
      return { 
        lat: geometry.coordinates[0][1], 
        lng: geometry.coordinates[0][0] 
      };
    }
  }

  // Для LineString берем первую точку
  if (geometry.type === 'LineString' && 
      Array.isArray(geometry.coordinates) && 
      geometry.coordinates.length > 0) {
    const firstPoint = geometry.coordinates[0];
    if (Array.isArray(firstPoint) && firstPoint.length >= 2) {
      return { 
        lat: firstPoint[1], 
        lng: firstPoint[0] 
      };
    }
  }

  // Для Polygon берем первую точку первого кольца
  if (geometry.type === 'Polygon' && 
      Array.isArray(geometry.coordinates) && 
      geometry.coordinates.length > 0) {
    const firstRing = geometry.coordinates[0];
    if (Array.isArray(firstRing) && firstRing.length > 0) {
      const firstPoint = firstRing[0];
      if (Array.isArray(firstPoint) && firstPoint.length >= 2) {
        return { 
          lat: firstPoint[1], 
          lng: firstPoint[0] 
        };
      }
    }
  }

  // Если ничего не подошло - возвращаем нулевые координаты
  return { lat: 0, lng: 0 };
}

function formatAddress(props: any): string {
  const city = props['addr:city'] || '';
  const street = props['addr:street'] || '';
  const housenumber = props['addr:housenumber'] || '';
  
  // Если есть только город - возвращаем только город
  if (city && !street && !housenumber) {
    return city;
  }
  
  return [city, street, housenumber]
    .filter(part => part)
    .join(', ')
    .trim();
}