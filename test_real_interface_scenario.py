#!/usr/bin/env python3
"""
Тест реального сценария создания команд через интерфейс
Проверяем, что происходит когда пользователь создает команду и добавляет к ней inline кнопки
"""

import requests
import json
import time

def create_real_user_scenario():
    """Имитирует реальный сценарий пользователя"""
    print("🎭 ИМИТАЦИЯ РЕАЛЬНОГО СЦЕНАРИЯ ПОЛЬЗОВАТЕЛЯ")
    print("=" * 50)
    
    # Шаг 1: Пользователь создает новый проект
    print("1. 👤 Пользователь создает новый проект...")
    project_data = {
        "name": "Мой тестовый бот",
        "description": "Тест inline кнопок",
        "data": {
            "nodes": [],
            "connections": []
        }
    }
    
    response = requests.post('http://localhost:5000/api/projects', json=project_data)
    if response.status_code != 201:
        print(f"❌ Ошибка создания проекта: {response.status_code}")
        return
    
    project_id = response.json()['id']
    print(f"✅ Проект создан с ID: {project_id}")
    
    # Шаг 2: Пользователь добавляет стартовую команду
    print("2. ➕ Добавляет стартовую команду...")
    bot_data = {
        "nodes": [
            {
                "id": "start-1",  # Стандартный ID
                "type": "start",
                "position": {"x": 100, "y": 100},
                "data": {
                    "command": "/start",
                    "messageText": "Привет! Это мой тестовый бот",
                    "keyboardType": "none",
                    "buttons": []
                }
            }
        ],
        "connections": []
    }
    
    # Обновляем проект
    update_response = requests.put(f'http://localhost:5000/api/projects/{project_id}', 
                                  json={"data": bot_data})
    if update_response.status_code != 200:
        print(f"❌ Ошибка обновления: {update_response.status_code}")
        return
    
    print("✅ Стартовая команда добавлена")
    
    # Шаг 3: Пользователь добавляет команду помощи
    print("3. ➕ Добавляет команду помощи...")
    help_node = {
        "id": "AbCdEf123456RandomId",  # Случайный ID как в реальности
        "type": "command", 
        "position": {"x": 300, "y": 100},
        "data": {
            "command": "/help",
            "messageText": "Это команда помощи с случайным ID",
            "keyboardType": "none",
            "buttons": []
        }
    }
    
    bot_data["nodes"].append(help_node)
    
    update_response = requests.put(f'http://localhost:5000/api/projects/{project_id}', 
                                  json={"data": bot_data})
    if update_response.status_code != 200:
        print(f"❌ Ошибка обновления: {update_response.status_code}")
        return
    
    print("✅ Команда помощи добавлена")
    
    # Шаг 4: Пользователь изменяет стартовую команду на inline клавиатуру
    print("4. 🔄 Изменяет стартовую команду - добавляет inline кнопку...")
    start_node = bot_data["nodes"][0]  # Получаем стартовый узел
    start_node["data"]["keyboardType"] = "inline"
    start_node["data"]["buttons"] = [
        {
            "id": "btn-help-random",
            "text": "📋 Помощь",
            "action": "goto",
            "target": "AbCdEf123456RandomId"  # Ссылаемся на случайный ID
        }
    ]
    
    update_response = requests.put(f'http://localhost:5000/api/projects/{project_id}', 
                                  json={"data": bot_data})
    if update_response.status_code != 200:
        print(f"❌ Ошибка обновления: {update_response.status_code}")
        return
    
    print("✅ Inline кнопка добавлена к стартовой команде")
    
    # Шаг 5: Генерируем код и проверяем
    print("5. 🔧 Генерируем код бота...")
    export_response = requests.post(f'http://localhost:5000/api/projects/{project_id}/export')
    if export_response.status_code != 200:
        print(f"❌ Ошибка экспорта: {export_response.status_code}")
        return
    
    generated_code = export_response.json()['code']
    
    # Сохраняем для анализа
    with open('real_scenario_generated.py', 'w', encoding='utf-8') as f:
        f.write(generated_code)
    
    print("✅ Код сгенерирован: real_scenario_generated.py")
    
    # Шаг 6: Анализируем код
    print("6. 🔍 Анализируем сгенерированный код...")
    analysis = analyze_inline_buttons(generated_code)
    
    print(f"\n📊 РЕЗУЛЬТАТЫ АНАЛИЗА:")
    print(f"  - Команда /start найдена: {'✅' if analysis['start_command'] else '❌'}")
    print(f"  - Команда /help найдена: {'✅' if analysis['help_command'] else '❌'}")
    print(f"  - Inline кнопки в /start: {'✅' if analysis['start_has_inline'] else '❌'}")
    print(f"  - Callback обработчик создан: {'✅' if analysis['callback_handler'] else '❌'}")
    print(f"  - Callback_data правильный: {'✅' if analysis['correct_callback_data'] else '❌'}")
    print(f"  - Синтаксис правильный: {'✅' if analysis['syntax_valid'] else '❌'}")
    
    # Проверяем конкретные проблемы
    print(f"\n🔍 ДЕТАЛЬНАЯ ПРОВЕРКА:")
    if 'callback_data="AbCdEf123456RandomId"' in generated_code:
        print("✅ Inline кнопка имеет правильный callback_data")
    else:
        print("❌ Inline кнопка имеет неправильный callback_data")
        # Ищем, что же там есть
        lines = [line.strip() for line in generated_code.split('\n') if 'callback_data=' in line]
        for line in lines:
            print(f"  Найдено: {line}")
    
    if 'lambda c: c.data == "AbCdEf123456RandomId"' in generated_code:
        print("✅ Callback обработчик слушает правильный callback_data")
    else:
        print("❌ Callback обработчик слушает неправильный callback_data")
        # Ищем обработчики
        lines = [line.strip() for line in generated_code.split('\n') if '@dp.callback_query' in line]
        for line in lines:
            print(f"  Найдено: {line}")
    
    if analysis['syntax_valid']:
        print("✅ Код компилируется без ошибок")
    else:
        print("❌ В коде есть синтаксические ошибки")
    
    return analysis

def analyze_inline_buttons(code):
    """Анализирует сгенерированный код на предмет inline кнопок"""
    return {
        'start_command': '@dp.message(CommandStart())' in code,
        'help_command': '@dp.message(Command("help"))' in code,
        'start_has_inline': 'InlineKeyboardBuilder()' in code and '/start' in code,
        'callback_handler': '@dp.callback_query' in code,
        'correct_callback_data': 'callback_data="AbCdEf123456RandomId"' in code,
        'syntax_valid': check_syntax(code)
    }

def check_syntax(code):
    """Проверяет синтаксис Python"""
    try:
        compile(code, '<string>', 'exec')
        return True
    except SyntaxError as e:
        print(f"  Синтаксическая ошибка: {e}")
        return False

def main():
    """Основная функция"""
    result = create_real_user_scenario()
    
    if result:
        issues = [k for k, v in result.items() if not v]
        if not issues:
            print(f"\n🎉 ВСЕ ПРОВЕРКИ ПРОШЛИ УСПЕШНО!")
            print("Inline кнопки должны работать правильно с случайными ID")
        else:
            print(f"\n❌ НАЙДЕНЫ ПРОБЛЕМЫ:")
            for issue in issues:
                print(f"  - {issue}")

if __name__ == "__main__":
    main()