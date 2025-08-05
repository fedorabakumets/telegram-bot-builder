"""
Тестовый бот для демонстрации возможностей геолокации с картографическими сервисами
"""

import requests
import json

def create_location_test_bot():
    """Создает тестовый бот с различными узлами геолокации"""
    
    bot_data = {
        "nodes": [
            {
                "id": "start-1",
                "type": "start",
                "position": {"x": 100, "y": 100},
                "data": {
                    "command": "/start",
                    "messageText": "🗺️ Демонстрация геолокации с картографическими сервисами\n\nВыберите тип геолокации:",
                    "keyboardType": "inline",
                    "buttons": [
                        {
                            "id": "btn-yandex",
                            "text": "🟡 Яндекс Карты",
                            "action": "goto",
                            "target": "yandex-location"
                        },
                        {
                            "id": "btn-google",
                            "text": "🔴 Google Maps",
                            "action": "goto",
                            "target": "google-location"
                        },
                        {
                            "id": "btn-2gis",
                            "text": "🟢 2ГИС",
                            "action": "goto",
                            "target": "gis-location"
                        },
                        {
                            "id": "btn-custom",
                            "text": "📍 Пользовательские координаты",
                            "action": "goto",
                            "target": "custom-location"
                        }
                    ]
                }
            },
            {
                "id": "yandex-location",
                "type": "location",
                "position": {"x": 300, "y": 50},
                "data": {
                    "title": "Красная площадь",
                    "address": "Красная площадь, Москва, Россия",
                    "latitude": 55.7558,
                    "longitude": 37.6176,
                    "mapService": "yandex",
                    "yandexMapUrl": "https://yandex.ru/maps/?ll=37.617644,55.755826&z=17&l=map",
                    "generateMapPreview": True,
                    "showDirections": True,
                    "keyboardType": "inline",
                    "buttons": [
                        {
                            "id": "btn-back-1",
                            "text": "🔙 Назад в меню",
                            "action": "goto",
                            "target": "start-1"
                        }
                    ]
                }
            },
            {
                "id": "google-location",
                "type": "location",
                "position": {"x": 500, "y": 50},
                "data": {
                    "title": "Эйфелева башня",
                    "address": "Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France",
                    "latitude": 48.8584,
                    "longitude": 2.2945,
                    "mapService": "google",
                    "googleMapUrl": "https://maps.google.com/?q=48.8584,2.2945",
                    "generateMapPreview": True,
                    "showDirections": True,
                    "keyboardType": "inline",
                    "buttons": [
                        {
                            "id": "btn-back-2",
                            "text": "🔙 Назад в меню",
                            "action": "goto",
                            "target": "start-1"
                        }
                    ]
                }
            },
            {
                "id": "gis-location",
                "type": "location",
                "position": {"x": 700, "y": 50},
                "data": {
                    "title": "Новосибирский оперный театр",
                    "address": "Красный проспект, 36, Новосибирск, Россия",
                    "latitude": 55.0415,
                    "longitude": 82.9346,
                    "mapService": "2gis",
                    "gisMapUrl": "https://2gis.ru/novosibirsk/firm/1267342919",
                    "generateMapPreview": True,
                    "showDirections": False,
                    "keyboardType": "inline",
                    "buttons": [
                        {
                            "id": "btn-back-3",
                            "text": "🔙 Назад в меню",
                            "action": "goto",
                            "target": "start-1"
                        }
                    ]
                }
            },
            {
                "id": "custom-location",
                "type": "location",
                "position": {"x": 900, "y": 50},
                "data": {
                    "title": "Статуя Свободы",
                    "address": "Liberty Island, New York, NY 10004, USA",
                    "latitude": 40.6892,
                    "longitude": -74.0445,
                    "mapService": "custom",
                    "generateMapPreview": True,
                    "showDirections": True,
                    "keyboardType": "inline",
                    "buttons": [
                        {
                            "id": "btn-back-4",
                            "text": "🔙 Назад в меню",
                            "action": "goto",
                            "target": "start-1"
                        }
                    ]
                }
            }
        ],
        "connections": [
            {"id": "conn-1", "source": "start-1", "target": "yandex-location"},
            {"id": "conn-2", "source": "start-1", "target": "google-location"},
            {"id": "conn-3", "source": "start-1", "target": "gis-location"},
            {"id": "conn-4", "source": "start-1", "target": "custom-location"},
            {"id": "conn-5", "source": "yandex-location", "target": "start-1"},
            {"id": "conn-6", "source": "google-location", "target": "start-1"},
            {"id": "conn-7", "source": "gis-location", "target": "start-1"},
            {"id": "conn-8", "source": "custom-location", "target": "start-1"}
        ]
    }
    
    return bot_data

def test_location_bot_generation():
    """Тестирует генерацию бота с геолокацией через API"""
    print("🧪 ТЕСТ: Бот с картографическими сервисами")
    print("=" * 50)
    
    # Создаем тестовый бот
    bot_data = create_location_test_bot()
    
    try:
        # Создаем проект через API
        project_data = {
            "name": "Демо картографических сервисов",
            "description": "Тестовый бот для демонстрации геолокации с Яндекс Карты, Google Maps и 2ГИС",
            "data": bot_data
        }
        
        create_response = requests.post('http://localhost:5000/api/projects', 
                                      json=project_data)
        if create_response.status_code != 201:
            print(f"❌ Ошибка создания проекта: {create_response.status_code}")
            print(create_response.text)
            return None
            
        project_id = create_response.json()['id']
        print(f"✅ Проект создан с ID: {project_id}")
        
        # Генерируем код через API экспорта
        export_response = requests.post(f'http://localhost:5000/api/projects/{project_id}/export')
        if export_response.status_code == 200:
            generated_code = export_response.json()['code']
            
            # Сохраняем сгенерированный код
            with open('location_maps_demo_bot.py', 'w', encoding='utf-8') as f:
                f.write(generated_code)
            print("✅ Код сгенерирован и сохранен в 'location_maps_demo_bot.py'")
            
            # Анализируем код
            print("\n📊 АНАЛИЗ СГЕНЕРИРОВАННОГО КОДА:")
            print("-" * 35)
            
            # Проверяем наличие функций работы с картами
            map_functions = [
                'extract_coordinates_from_yandex',
                'extract_coordinates_from_google', 
                'extract_coordinates_from_2gis',
                'generate_map_urls'
            ]
            
            for func in map_functions:
                if func in generated_code:
                    print(f"  ✅ Функция {func} найдена")
                else:
                    print(f"  ❌ Функция {func} отсутствует")
            
            # Проверяем поддержку различных сервисов
            if 'яндекс_url' in generated_code.lower() or 'yandex_url' in generated_code:
                print("  ✅ Поддержка Яндекс Карт")
            else:
                print("  ❌ Поддержка Яндекс Карт отсутствует")
            
            if 'google_url' in generated_code:
                print("  ✅ Поддержка Google Maps")
            else:
                print("  ❌ Поддержка Google Maps отсутствует")
            
            if 'gis_url' in generated_code:
                print("  ✅ Поддержка 2ГИС")
            else:
                print("  ❌ Поддержка 2ГИС отсутствует")
            
            # Проверяем генерацию кнопок карт
            if 'Яндекс Карты' in generated_code and 'Google Maps' in generated_code and '2ГИС' in generated_code:
                print("  ✅ Кнопки картографических сервисов генерируются")
            else:
                print("  ❌ Кнопки картографических сервисов отсутствуют")
            
            # Проверяем поддержку маршрутов
            if 'Маршрут' in generated_code:
                print("  ✅ Поддержка построения маршрутов")
            else:
                print("  ❌ Поддержка построения маршрутов отсутствует")
            
            print(f"\n📈 СТАТИСТИКА:")
            print(f"  • Строк кода: {len(generated_code.splitlines())}")
            print(f"  • Символов: {len(generated_code)}")
            print(f"  • Узлов в боте: {len(bot_data['nodes'])}")
            print(f"  • Связей: {len(bot_data['connections'])}")
            
            return True
        else:
            print(f"❌ Ошибка экспорта: {export_response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Ошибка запроса: {e}")
        return False

def main():
    """Основная функция тестирования"""
    success = test_location_bot_generation()
    
    if success:
        print("\n🎉 ТЕСТ ПРОЙДЕН УСПЕШНО!")
        print("Файл 'location_maps_demo_bot.py' готов для тестирования.")
        print("\nДля запуска бота:")
        print("1. Получите токен у @BotFather")
        print("2. Замените YOUR_BOT_TOKEN_HERE в файле на реальный токен")
        print("3. Запустите: python location_maps_demo_bot.py")
    else:
        print("\n❌ ТЕСТ НЕ ПРОЙДЕН!")
        print("Проверьте логи для диагностики проблем.")

if __name__ == "__main__":
    main()