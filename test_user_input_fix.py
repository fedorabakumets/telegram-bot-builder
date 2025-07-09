"""
Тест исправления проблемы с пользовательским вводом
Создание бота с командой и inline кнопкой, ведущей к узлу user-input
"""

import json
import requests

def create_test_bot():
    """Создает тестовый бот с командой и пользовательским вводом"""
    
    bot_data = {
        "nodes": [
            {
                "id": "start-node",
                "type": "start",
                "data": {
                    "messageText": "Добро пожаловать! Нажмите кнопку для ввода данных:",
                    "command": "/start",
                    "keyboardType": "inline",
                    "buttons": [
                        {
                            "id": "btn-input",
                            "text": "📝 Ввести данные",
                            "action": "goto",
                            "target": "input-node"
                        }
                    ]
                }
            },
            {
                "id": "input-node", 
                "type": "user-input",
                "data": {
                    "inputPrompt": "Пожалуйста, введите ваше имя:",
                    "inputType": "text",
                    "inputVariable": "user_name",
                    "minLength": 2,
                    "maxLength": 50,
                    "inputRequired": True,
                    "saveToDatabase": True,
                    "inputSuccessMessage": "Спасибо! Ваше имя сохранено.",
                    "inputRetryMessage": "Пожалуйста, введите корректное имя."
                }
            }
        ],
        "connections": [
            {
                "source": "start-node",
                "target": "input-node",
                "sourceHandle": "btn-input",
                "targetHandle": "input"
            }
        ]
    }
    
    return bot_data

def test_bot_generation():
    """Тестирует генерацию Python кода"""
    
    # Создаем тестовые данные бота
    bot_data = create_test_bot()
    
    try:
        # Сохраняем бот через API
        response = requests.post('http://localhost:5000/api/projects', 
                               json={
                                   'name': 'Тест пользовательского ввода',
                                   'description': 'Тест исправления проблемы с user-input',
                                   'data': bot_data
                               })
        
        if response.status_code == 200:
            project = response.json()
            project_id = project['id']
            print(f"✅ Тестовый бот создан с ID: {project_id}")
            
            # Экспортируем Python код
            export_response = requests.get(f'http://localhost:5000/api/projects/{project_id}/export')
            
            if export_response.status_code == 200:
                python_code = export_response.json()['pythonCode']
                
                # Сохраняем код в файл для проверки
                with open('test_user_input_bot_FIXED.py', 'w', encoding='utf-8') as f:
                    f.write(python_code)
                
                print("✅ Python код экспортирован в test_user_input_bot_FIXED.py")
                
                # Проверяем основные моменты
                checks = [
                    ('generateUserInputHandler НЕ вызывается для команд', 'def start_handler' in python_code and 'waiting_for_input' not in python_code.split('def start_handler')[1].split('def ')[0]),
                    ('Есть callback обработчик для inline кнопки', 'handle_callback_input_node' in python_code),
                    ('Callback обработчик устанавливает ожидание ввода', '"waiting_for_input"' in python_code),
                    ('Есть универсальный обработчик пользовательского ввода', 'handle_user_input' in python_code),
                    ('Валидация длины текста работает', 'min_length' in python_code and 'max_length' in python_code),
                    ('Сохранение в базу данных включено', 'save_to_database' in python_code)
                ]
                
                print("\n🔍 Результаты проверки:")
                all_passed = True
                for check_name, condition in checks:
                    status = "✅" if condition else "❌"
                    print(f"{status} {check_name}")
                    if not condition:
                        all_passed = False
                
                if all_passed:
                    print("\n🎉 ВСЕ ПРОВЕРКИ ПРОШЛИ! Исправление работает корректно.")
                else:
                    print("\n⚠️ Некоторые проверки не прошли, нужна дополнительная отладка.")
                    
                return project_id
                
            else:
                print(f"❌ Ошибка экспорта: {export_response.text}")
                
        else:
            print(f"❌ Ошибка создания бота: {response.text}")
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return None

if __name__ == "__main__":
    print("🧪 Тестирование исправления проблемы с пользовательским вводом...")
    test_bot_generation()