"""
Создание тестового бота для проверки исправленных callback обработчиков
"""
import requests
import json

def create_test_bot():
    """Создает тестовый бот через API"""
    
    # Структура простого бота для проверки callback обработчиков
    bot_data = {
        "name": "Тест Callback Бот",
        "description": "Тестовый бот для проверки callback обработчиков",
        "data": {
            "nodes": [
                {
                    "id": "start-node-1",
                    "type": "start",
                    "position": {"x": 100, "y": 100},
                    "data": {
                        "messageText": "Привет! Выберите действие:",
                        "keyboardType": "inline",
                        "buttons": [
                            {
                                "id": "btn-info-1",
                                "text": "📊 Информация",
                                "action": "goto",
                                "target": "info-node-2"
                            },
                            {
                                "id": "btn-settings-1", 
                                "text": "⚙️ Настройки",
                                "action": "goto",
                                "target": "settings-node-3"
                            }
                        ],
                        "resizeKeyboard": True,
                        "oneTimeKeyboard": False
                    }
                },
                {
                    "id": "info-node-2",
                    "type": "message",
                    "position": {"x": 300, "y": 100},
                    "data": {
                        "messageText": "📊 Информация о боте:\n\nЭто тестовый бот для проверки callback обработчиков.\nВсе кнопки должны работать правильно.",
                        "keyboardType": "inline",
                        "buttons": [
                            {
                                "id": "btn-back-info",
                                "text": "🔙 Назад к меню",
                                "action": "goto",
                                "target": "start-node-1"
                            }
                        ]
                    }
                },
                {
                    "id": "settings-node-3",
                    "type": "message",
                    "position": {"x": 500, "y": 100}, 
                    "data": {
                        "messageText": "⚙️ Настройки:\n\nЗдесь будут настройки бота.\nВыберите нужную опцию:",
                        "keyboardType": "inline",
                        "buttons": [
                            {
                                "id": "btn-back-settings",
                                "text": "🔙 Назад к меню",
                                "action": "goto",
                                "target": "start-node-1"
                            }
                        ]
                    }
                }
            ],
            "connections": []
        }
    }
    
    try:
        # Сначала создаем проект
        response = requests.post("http://localhost:5000/api/projects", json=bot_data)
        
        if response.status_code == 200:
            project_data = response.json()
            project_id = project_data["id"]
            print(f"✅ Проект создан с ID: {project_id}")
            
            # Теперь экспортируем код
            export_response = requests.post(f"http://localhost:5000/api/projects/{project_id}/export")
            
            if export_response.status_code == 200:
                files = export_response.json()["files"]
                
                # Сохраняем основной файл бота
                main_file = files.get("main.py", "")
                if main_file:
                    with open("test_callback_fixed_bot.py", "w", encoding="utf-8") as f:
                        f.write(main_file)
                    
                    print("✅ Код бота сохранен в test_callback_fixed_bot.py")
                    
                    # Проверяем ключевые элементы
                    print("\nПроверка исправлений:")
                    
                    checks = [
                        ('callback_data="info-node-2"', "Кнопка 'Информация' использует ID узла"),
                        ('callback_data="settings-node-3"', "Кнопка 'Настройки' использует ID узла"),
                        ('callback_data="start-node-1"', "Кнопка 'Назад' использует ID узла"),
                        ('c.data == "info-node-2"', "Обработчик информации проверяет правильный ID"),
                        ('c.data == "settings-node-3"', "Обработчик настроек проверяет правильный ID"),
                        ('c.data == "start-node-1"', "Обработчик назад проверяет правильный ID"),
                        ('await callback_query.answer()', "Обработчики отвечают на callback"),
                        ('await callback_query.message.edit_text', "Обработчики редактируют сообщения")
                    ]
                    
                    for check, description in checks:
                        if check in main_file:
                            print(f"✅ {description}")
                        else:
                            print(f"❌ {description}")
                    
                    return project_id
                else:
                    print("❌ Не удалось получить код бота")
            else:
                print(f"❌ Ошибка экспорта: {export_response.status_code}")
                print(export_response.text)
        else:
            print(f"❌ Ошибка создания проекта: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        
    return None

if __name__ == "__main__":
    print("Создание тестового бота для проверки callback обработчиков...")
    create_test_bot()