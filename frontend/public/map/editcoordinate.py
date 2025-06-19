# ОБРАБАТЫВАЕТ ОДИН ФАЙЛЫ 
# import json
# import os

# def process_geojson(input_path, output_path, default_city=None):
#     """
#     Обрабатывает GeoJSON файл и сохраняет в формате:
#     - FeatureCollection как валидный GeoJSON
#     - Каждый Feature на новой строке
#     - Features разделены запятыми (кроме последнего)
#     """
#     with open(input_path, 'r', encoding='utf-8') as f:
#         data = json.load(f)
    
#     processed_features = []
    
#     for feature in data['features']:
#         properties = feature.get('properties', {})
#         geometry = feature.get('geometry', {})
        
#         # Проверка обязательных полей
#         if not all(k in properties for k in ['addr:housenumber', 'addr:street']):
#             continue
#         if 'coordinates' not in geometry:
#             continue
        
#         # Добавление города по умолчанию если нужно
#         if 'addr:city' not in properties and default_city:
#             properties['addr:city'] = default_city
        
#         # Формирование объекта Feature
#         feature_obj = {
#             'geometry': {
#                 'coordinates': geometry.get('coordinates', [])
#             },
#             'properties': {
#                 'addr:city': properties.get('addr:city', ''),
#                 'addr:housenumber': properties['addr:housenumber'],
#                 'addr:street': properties['addr:street']
#             }
#         }
#         processed_features.append(feature_obj)
    
#     # Формируем строки для записи
#     lines = [
#         '{',
#         '"features": ['
#     ]
    
#     # Добавляем каждый Feature на отдельной строке с запятой (кроме последнего)
#     for i, feature in enumerate(processed_features):
#         feature_str = json.dumps(feature, ensure_ascii=False, separators=(',', ':'))
#         if i < len(processed_features) - 1:
#             feature_str += ','
#         lines.append(feature_str)
    
#     # Завершаем JSON
#     lines.extend([
#         ']',
#         '}'
#     ])
    
#     # Записываем в файл
#     with open(output_path, 'w', encoding='utf-8') as f:
#         f.write('\n'.join(lines))
    
#     return processed_features

# if __name__ == '__main__':
#     script_dir = os.path.dirname(os.path.abspath(__file__))
#     input_file = os.path.join(script_dir, 'Новосоветское.geojson')
#     output_file = os.path.join(script_dir, 'Новосоветское_1.json')
    
#     features = process_geojson(input_file, output_file, 'Новосоветское')
    
#     print(f"Обработано {len(features)} объектов")
#     print(f"Результат сохранён в: {output_file}")

# ВСЕ ФАЙЛЫ ОБРАБАТЫВАЕТ

# import json
# import os

# def process_geojson(input_path, output_path, default_city=None):
#     """
#     Обрабатывает GeoJSON файл и сохраняет в формате:
#     - FeatureCollection как валидный GeoJSON
#     - Каждый Feature на новой строке
#     - Features разделены запятыми (кроме последнего)
#     """
#     with open(input_path, 'r', encoding='utf-8') as f:
#         data = json.load(f)
    
#     processed_features = []
    
#     for feature in data['features']:
#         properties = feature.get('properties', {})
#         geometry = feature.get('geometry', {})
        
#         # Проверка обязательных полей
#         if not all(k in properties for k in ['addr:housenumber', 'addr:street']):
#             continue
#         if 'coordinates' not in geometry:
#             continue
        
#         # Добавление города по умолчанию если нужно
#         if 'addr:city' not in properties and default_city:
#             properties['addr:city'] = default_city
        
#         # Формирование объекта Feature
#         feature_obj = {
#             'geometry': {
#                 'coordinates': geometry.get('coordinates', [])
#             },
#             'properties': {
#                 'addr:city': properties.get('addr:city', ''),
#                 'addr:housenumber': properties['addr:housenumber'],
#                 'addr:street': properties['addr:street']
#             }
#         }
#         processed_features.append(feature_obj)
    
#     # Формируем строки для записи
#     lines = [
#         '{',
#         '"features": ['
#     ]
    
#     # Добавляем каждый Feature на отдельной строке с запятой (кроме последнего)
#     for i, feature in enumerate(processed_features):
#         feature_str = json.dumps(feature, ensure_ascii=False, separators=(',', ':'))
#         if i < len(processed_features) - 1:
#             feature_str += ','
#         lines.append(feature_str)
    
#     # Завершаем JSON
#     lines.extend([
#         ']',
#         '}'
#     ])
    
#     # Записываем в файл
#     with open(output_path, 'w', encoding='utf-8') as f:
#         f.write('\n'.join(lines))
    
#     return processed_features

# if __name__ == '__main__':
#     script_dir = os.path.dirname(os.path.abspath(__file__))
#     input_folder = os.path.join(script_dir, 'BBBike')
#     output_folder = os.path.join(script_dir, 'BBBike_processed')
    
#     # Создаем папку для обработанных файлов, если ее нет
#     if not os.path.exists(output_folder):
#         os.makedirs(output_folder)
    
#     # Получаем список всех файлов в папке BBBike
#     processed_files = 0
#     for filename in os.listdir(input_folder):
#         if filename.endswith('.geojson') or filename.endswith('.json'):
#             input_file = os.path.join(input_folder, filename)
            
#             # Формируем имя выходного файла
#             base_name = os.path.splitext(filename)[0]
#             output_file = os.path.join(output_folder, f"{base_name}_1.json")
            
#             # Определяем город из имени файла (можно использовать как default_city)
#             default_city = base_name
            
#             try:
#                 features = process_geojson(input_file, output_file, default_city)
#                 print(f"Обработан файл {filename} -> {base_name}_1.json ({len(features)} объектов)")
#                 processed_files += 1
#             except Exception as e:
#                 print(f"Ошибка при обработке файла {filename}: {str(e)}")
    
#     print(f"\nОбработка завершена. Обработано файлов: {processed_files}")
#     print(f"Результаты сохранены в папке: {output_folder}")

# ОБЪЕДИНЕНИЕ ФАЙЛОВ В ОДИН

import json
import os
import glob

def merge_geojson_files(input_folder, output_file):
    """
    Объединяет все GeoJSON файлы из папки в один JSON файл,
    где каждый feature записан в одну строку
    """
    all_features = []
    
    # Получаем список всех JSON файлов в папке
    file_pattern = os.path.join(input_folder, '*.json')
    files = glob.glob(file_pattern)
    
    for file_path in files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            if 'features' in data and isinstance(data['features'], list):
                all_features.extend(data['features'])
                print(f"Добавлено {len(data['features'])} объектов из {os.path.basename(file_path)}")
                
        except Exception as e:
            print(f"Ошибка при обработке файла {os.path.basename(file_path)}: {str(e)}")
    
    # Формируем содержимое файла
    lines = ['{"features": [']
    
    # Добавляем каждый feature в одну строку
    for i, feature in enumerate(all_features):
        feature_str = json.dumps(feature, ensure_ascii=False, separators=(',', ':'))
        if i < len(all_features) - 1:
            feature_str += ','
        lines.append(feature_str)
    
    lines.append(']}')
    
    # Записываем в файл
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    
    return {"features": all_features}

if __name__ == '__main__':
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_folder = os.path.join(script_dir, 'BBBike_processed')
    output_file = os.path.join(script_dir, 'merged_features.json')
    
    if not os.path.exists(input_folder):
        print(f"Папка {input_folder} не существует!")
        exit()
    
    print("Начинаем объединение файлов...")
    result = merge_geojson_files(input_folder, output_file)
    
    print(f"\nОбъединение завершено! Всего объектов: {len(result['features'])}")
    print(f"Результат сохранен в: {output_file}")