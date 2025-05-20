import json
import os

def process_geojson(input_path, output_path, default_city=None):
    """
    Обрабатывает GeoJSON файл и сохраняет в формате:
    - FeatureCollection как валидный GeoJSON
    - Каждый Feature на новой строке
    - Features разделены запятыми (кроме последнего)
    """
    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    processed_features = []
    
    for feature in data['features']:
        properties = feature.get('properties', {})
        geometry = feature.get('geometry', {})
        
        # Проверка обязательных полей
        if not all(k in properties for k in ['addr:housenumber', 'addr:street']):
            continue
        if 'coordinates' not in geometry:
            continue
        
        # Добавление города по умолчанию если нужно
        if 'addr:city' not in properties and default_city:
            properties['addr:city'] = default_city
        
        # Формирование объекта Feature
        feature_obj = {
            'geometry': {
                'coordinates': geometry.get('coordinates', [])
            },
            'properties': {
                'addr:city': properties.get('addr:city', ''),
                'addr:housenumber': properties['addr:housenumber'],
                'addr:street': properties['addr:street']
            }
        }
        processed_features.append(feature_obj)
    
    # Формируем строки для записи
    lines = [
        '{',
        '"features": ['
    ]
    
    # Добавляем каждый Feature на отдельной строке с запятой (кроме последнего)
    for i, feature in enumerate(processed_features):
        feature_str = json.dumps(feature, ensure_ascii=False, separators=(',', ':'))
        if i < len(processed_features) - 1:
            feature_str += ','
        lines.append(feature_str)
    
    # Завершаем JSON
    lines.extend([
        ']',
        '}'
    ])
    
    # Записываем в файл
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    
    return processed_features

if __name__ == '__main__':
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_file = os.path.join(script_dir, 'Komsomolsk.geojson')
    output_file = os.path.join(script_dir, 'output_formatted.json')
    
    features = process_geojson(input_file, output_file, 'Комсомольск-на-Амуре')
    
    print(f"Обработано {len(features)} объектов")
    print(f"Результат сохранён в: {output_file}")
    # print("\nПример содержимого файла:")
    # with open(output_file, 'r', encoding='utf-8') as f:
    #     print(f.read()[:500] + "...")  # Выводим начало файла