"""
Тестирование индивидуальной навигации кнопочных ответов
Создает бот для проверки что каждая кнопка может иметь собственную навигацию
"""

import requests
import json
import time

def create_test_bot():
    """Создает тестовый бот с индивидуальной навигацией кнопочных ответов"""
    
    # Данные бота с user-input узлом, имеющим кнопки с разной навигацией
    bot_data = {
        "name": "Тест индивидуальной навигации кнопок",
        "description": "Тестирует что каждая кнопка ответа может иметь собственную навигацию",
        "nodes": [
            {
                "id": "start-1",
                "type": "start", 
                "position": {"x": 100, "y": 100},
                "data": {
                    "messageText": "Добро пожаловать! Выберите тип действия:",
                    "command": "/start",
                    "keyboardType": "inline",
                    "buttons": [
                        {
                            "id": "btn-1",
                            "text": "Начать опрос",
                            "action": "goto",
                            "target": "survey-1"
                        }
                    ]
                }
            },
            {
                "id": "survey-1",
                "type": "user-input",
                "position": {"x": 300, "y": 100}, 
                "data": {
                    "messageText": "Что вас интересует?",
                    "responseType": "buttons",
                    "inputVariable": "user_interest",
                    "saveToDatabase": True,
                    "responseOptions": [
                        {
                            "text": "📱 Технологии",
                            "value": "tech",
                            "action": "goto",
                            "target": "tech-info"
                        },
                        {
                            "text": "🎵 Музыка", 
                            "value": "music",
                            "action": "command",
                            "target": "/music"
                        },
                        {
                            "text": "🌐 Сайт",
                            "value": "website",
                            "action": "url",
                            "url": "https://example.com"
                        },
                        {
                            "text": "🔄 Главное меню",
                            "value": "menu",
                            "action": "goto", 
                            "target": "start-1"
                        }
                    ]
                }
            },
            {
                "id": "tech-info",
                "type": "message",
                "position": {"x": 500, "y": 50},
                "data": {
                    "messageText": "🤖 Технологии - это будущее! Вы выбрали отличную тему.",
                    "keyboardType": "inline",
                    "buttons": [
                        {
                            "id": "btn-back",
                            "text": "Назад к опросу",
                            "action": "goto",
                            "target": "survey-1"
                        }
                    ]
                }
            },
            {
                "id": "music-cmd",
                "type": "command",
                "position": {"x": 500, "y": 150},
                "data": {
                    "messageText": "🎵 Музыка - язык души! Какой жанр предпочитаете?",
                    "command": "/music",
                    "keyboardType": "inline", 
                    "buttons": [
                        {
                            "id": "btn-rock",
                            "text": "🎸 Рок",
                            "action": "goto",
                            "target": "start-1"
                        },
                        {
                            "id": "btn-pop",
                            "text": "🎤 Поп",
                            "action": "goto", 
                            "target": "start-1"
                        }
                    ]
                }
            }
        ],
        "connections": [
            {"id": "conn-1", "source": "start-1", "target": "survey-1"},
            {"id": "conn-2", "source": "survey-1", "target": "tech-info"},
            {"id": "conn-3", "source": "tech-info", "target": "survey-1"}
        ]
    }
    
    return bot_data

def test_code_generation():
    """Тестирует генерацию Python кода"""
    
    print("🚀 Создание тестового бота...")
    
    # Создаем проект
    create_response = requests.post('http://localhost:5000/api/projects', json={
        'name': 'Тест навигации кнопок',
        'description': 'Тестирование индивидуальной навигации',
        'data': {}
    })
    
    if create_response.status_code not in [200, 201]:
        print(f"❌ Ошибка создания проекта: {create_response.status_code}")
        return False
    
    project = create_response.json()
    project_id = project['id']
    print(f"✅ Проект создан с ID: {project_id}")
    
    # Обновляем проект с данными бота
    bot_data = create_test_bot()
    update_response = requests.put(f'http://localhost:5000/api/projects/{project_id}', json={
        'name': bot_data['name'],
        'description': bot_data['description'], 
        'data': bot_data
    })
    
    if update_response.status_code != 200:
        print(f"❌ Ошибка обновления проекта: {update_response.status_code}")
        return False
    
    print("✅ Данные бота сохранены")
    
    # Генерируем Python код
    print("🔄 Генерация Python кода...")
    export_response = requests.post(f'http://localhost:5000/api/projects/{project_id}/export', json={
        'format': 'python'
    })
    
    if export_response.status_code != 200:
        print(f"❌ Ошибка генерации кода: {export_response.status_code}")
        if export_response.text:
            print(f"Ответ сервера: {export_response.text}")
        return False
    
    # Извлекаем код из JSON ответа
    response_data = export_response.json()
    generated_code = response_data.get('code', '')
    print("✅ Код успешно сгенерирован")
    
    # Сохраняем код в файл для анализа
    filename = f"generated_individual_navigation_test_{int(time.time())}.py"
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(generated_code)
    
    print(f"📁 Код сохранен в файл: {filename}")
    
    # Анализируем код
    print("\n🔍 Анализ сгенерированного кода:")
    
    checks = [
        ("Конфигурация кнопок", '"options": [' in generated_code),
        ("Индивидуальные действия", '"action":' in generated_code),
        ("Переход к узлу", '"action": "goto"' in generated_code),
        ("Выполнение команды", '"action": "command"' in generated_code), 
        ("Открытие ссылки", '"action": "url"' in generated_code),
        ("Обработчик user-input", 'handle_response_survey_1_' in generated_code),
        ("Навигация по action", 'option_action = current_option.get("action"' in generated_code),
        ("URL обработка", 'if option_action == "url"' in generated_code),
        ("Command обработка", 'elif option_action == "command"' in generated_code),
        ("Goto обработка", 'elif option_action == "goto"' in generated_code),
        ("Команда /music", '/music' in generated_code),
    ]
    
    passed = 0
    for check_name, check_result in checks:
        status = "✅" if check_result else "❌"
        print(f"  {status} {check_name}")
        if check_result:
            passed += 1
    
    print(f"\n📊 Результат: {passed}/{len(checks)} проверок пройдено")
    
    if passed == len(checks):
        print("🎉 ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ! Индивидуальная навигация кнопок работает корректно")
        return True
    else:
        print("⚠️ Некоторые проверки не пройдены, требуется доработка")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("🧪 ТЕСТИРОВАНИЕ ИНДИВИДУАЛЬНОЙ НАВИГАЦИИ КНОПОЧНЫХ ОТВЕТОВ")
    print("=" * 60)
    
    success = test_code_generation()
    
    print("\n" + "=" * 60)
    if success:
        print("✅ ТЕСТИРОВАНИЕ ЗАВЕРШЕНО УСПЕШНО")
    else:
        print("❌ ТЕСТИРОВАНИЕ ЗАВЕРШЕНО С ОШИБКАМИ")
    print("=" * 60)