import json
import re
from pathlib import Path
from typing import Optional, Tuple, Dict, List, Any
from django.core.cache import cache

class AddressGeocoder:
    _instance = None
    _geo_json: Optional[Dict] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._load_data()
        return cls._instance

    def _load_data(self):
        geo_file = Path('/app/data/coordinate.osm.json')
        if not geo_file.exists():
            print(f"❌ GeoJSON файл не найден: {geo_file}")
            return
        try:
            with open(geo_file, 'r', encoding='utf-8') as f:
                self._geo_json = json.load(f)
            print(f"✅ GeoJSON загружен, объектов: {len(self._geo_json['features'])}")
        except Exception as e:
            print(f"Ошибка загрузки GeoJSON: {e}")

    # ---------- НОРМАЛИЗАЦИЯ (учитывает порядок слов) ----------
    def _normalize_city(self, city: str) -> str:
        # удаляем "г." в начале, приводим к нижнему регистру
        return re.sub(r'^г\.\s*', '', city).strip().lower()

    def _normalize_street(self, street: str) -> str:
        """Приводит название улицы к каноническому виду:
           - удаляет 'ул.', 'улица' в начале или в конце
           - удаляет точки, запятые
           - схлопывает пробелы"""
        street = street.strip().lower()
        # удаляем префикс
        street = re.sub(r'^(ул\.|улица)\s*', '', street)
        # удаляем суффикс
        street = re.sub(r'\s+(ул\.|улица)$', '', street)
        # удаляем точки, запятые
        street = street.replace(',', '').replace('.', '')
        # схлопываем множественные пробелы
        street = re.sub(r'\s+', ' ', street).strip()
        return street

    def _normalize_address(self, addr: str) -> str:
        # общая нормализация (город, улица, номер)
        return re.sub(r'^г\.\s*', '', addr).strip().lower().replace(',', '').replace('.', '')

    def _build_search_address(self, query: str) -> Dict[str, str]:
        parts = [p.strip() for p in query.split(',')]
        if len(parts) == 1:
            return {'city': parts[0]}

        known_cities = ['Аргунское', 'Покровка']  # можно дополнить
        potential_city = parts[0]
        if potential_city in known_cities:
            if len(parts) == 2:
                return {'city': parts[0], 'street': parts[1]}
            if len(parts) == 3:
                return {'city': parts[0], 'street': parts[1], 'housenumber': parts[2]}

        if len(parts) == 3:
            return {'city': parts[0], 'street': parts[1], 'housenumber': parts[2]}
        elif len(parts) == 2:
            if re.search(r'\d', parts[1]):
                return {'street': parts[0], 'housenumber': parts[1]}
            else:
                return {'city': parts[0], 'street': parts[1]}
        return {'street': self._normalize_address(query)}

    # ---------- ИЗВЛЕЧЕНИЕ КООРДИНАТ ИЗ ГЕОМЕТРИИ ----------
    def _get_coordinates(self, geometry: Any) -> Tuple[float, float]:
        if geometry and isinstance(geometry.get('lat'), (int, float)) and isinstance(geometry.get('lng'), (int, float)):
            return (geometry['lat'], geometry['lng'])

        if not geometry or not geometry.get('coordinates'):
            return (0.0, 0.0)

        coords = geometry['coordinates']
        if geometry.get('type') == 'Point' and len(coords) >= 2:
            return (coords[1], coords[0])

        if geometry.get('type') == 'LineString' and coords and len(coords[0]) >= 2:
            return (coords[0][1], coords[0][0])

        if geometry.get('type') == 'Polygon' and coords and coords[0] and len(coords[0][0]) >= 2:
            return (coords[0][0][1], coords[0][0][0])

        if isinstance(coords[0], list) and len(coords[0]) >= 2:
            return (coords[0][1], coords[0][0])
        if isinstance(coords, list) and len(coords) >= 2:
            return (coords[1], coords[0])

        return (0.0, 0.0)

    # ---------- ОСНОВНОЙ МЕТОД ГЕОКОДИРОВАНИЯ ----------
    def geocode(self, address: str) -> Optional[Tuple[float, float]]:
        if not address or not self._geo_json:
            return None

        cache_key = f"geocode_{address}"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        # 1. Поиск по точному совпадению имени (нормализованному)
        normalized_query = self._normalize_address(address)
        for feature in self._geo_json['features']:
            props = feature.get('properties', {})
            name = props.get('name', '')
            if self._normalize_address(name) == normalized_query:
                lat, lng = self._get_coordinates(feature['geometry'])
                if lat != 0.0 or lng != 0.0:
                    result = (lat, lng)
                    cache.set(cache_key, result, 3600)
                    return result

        # 2. Разбор адреса на части
        search_addr = self._build_search_address(address)
        city = search_addr.get('city')
        street = search_addr.get('street')
        housenumber = search_addr.get('housenumber')

        # Фильтр по городу (если указан)
        filtered_features = self._geo_json['features']
        if city:
            norm_city = self._normalize_city(city)
            filtered_features = [
                f for f in filtered_features
                if self._normalize_city(f.get('properties', {}).get('addr:city', '')) == norm_city
            ]

        # 3. Поиск по улице + номеру дома
        if street and housenumber:
            norm_street = self._normalize_street(street)
            norm_housenumber = self._normalize_address(housenumber)
            for feature in filtered_features:
                props = feature.get('properties', {})
                feat_street = self._normalize_street(props.get('addr:street', ''))
                feat_housenumber = self._normalize_address(props.get('addr:housenumber', ''))
                if feat_street == norm_street and feat_housenumber == norm_housenumber:
                    lat, lng = self._get_coordinates(feature['geometry'])
                    if lat != 0.0 or lng != 0.0:
                        result = (lat, lng)
                        cache.set(cache_key, result, 3600)
                        return result

        # 4. Поиск только по улице
        if street:
            norm_street = self._normalize_street(street)
            for feature in filtered_features:
                props = feature.get('properties', {})
                feat_street = self._normalize_street(props.get('addr:street', ''))
                if feat_street == norm_street:
                    lat, lng = self._get_coordinates(feature['geometry'])
                    if lat != 0.0 or lng != 0.0:
                        result = (lat, lng)
                        cache.set(cache_key, result, 3600)
                        return result

        # 5. Если есть только город – берём первый объект в городе
        if city and filtered_features:
            lat, lng = self._get_coordinates(filtered_features[0]['geometry'])
            if lat != 0.0 or lng != 0.0:
                result = (lat, lng)
                cache.set(cache_key, result, 3600)
                return result

        return None