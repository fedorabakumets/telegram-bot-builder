#!/usr/bin/env python3
"""
Прямой тест форматирования в реальных условиях
"""

import json
import requests

def create_formatting_test():
    """Создаем тест для проверки форматирования"""
    
    bot_data = {
        "nodes": [
            {
                "id": "start-1",
                "type": "start",
                "data": {
                    "command": "/start",
                    "messageText": "Привет! **Добро пожаловать!**\n\n*Курсивный текст*\n`Код`\n__Подчеркнутый__",
                    "keyboardType": "inline",
                    "formatMode": "markdown",
                    "buttons": [
                        {
                            "id": "btn-html",
                            "text": "HTML тест",
                            "action": "goto",
                            "target": "html-test"
                        }
                    ]
                },
                "position": {"x": 100, "y": 100}
            },
            {
                "id": "html-test",
                "type": "message",
                "data": {
                    "messageText": "Привет! <b>Добро пожаловать!</b>\n\n<i>Курсивный текст</i>\n<code>Код</code>\n<u>Подчеркнутый</u>",
                    "keyboardType": "inline",
                    "formatMode": "html",
                    "buttons": [
                        {
                            "id": "btn-back",
                            "text": "Назад",
                            "action": "goto",
                            "target": "start-1"
                        }
                    ]
                },
                "position": {"x": 300, "y": 100}
            }
        ],
        "connections": [
            {"id": "conn1", "from": "start-1", "to": "html-test"},
            {"id": "conn2", "from": "html-test", "to": "start-1"}
        ]
    }
    
    return bot_data

def test_real_formatting():
    """Тестируем реальное форматирование"""
    
    print("🧪 РЕАЛЬНЫЙ ТЕСТ ФОРМАТИРОВАНИЯ")
    print("=" * 50)
    
    # Создаём тестовый бот
    bot_data = create_formatting_test()
    
    # Создаём проект через API
    project_data = {
        "name": "Реальный тест форматирования",
        "description": "Тест для проверки реального форматирования",
        "data": bot_data
    }
    
    try:
        # Создаём проект
        create_response = requests.post('http://localhost:5000/api/projects', 
                                      json=project_data)
        
        if create_response.status_code == 201:
            project_id = create_response.json()['id']
            print(f"✅ Проект создан с ID: {project_id}")
            
            # Генерируем код
            export_response = requests.post(f'http://localhost:5000/api/projects/{project_id}/export')
            
            if export_response.status_code == 200:
                generated_code = export_response.json()['code']
                
                # Сохраняем код для анализа
                with open('real_formatting_test.py', 'w', encoding='utf-8') as f:
                    f.write(generated_code)
                
                print("✅ Код сохранён в 'real_formatting_test.py'")
                
                # Анализируем start_handler
                analyze_start_handler(generated_code)
                
            else:
                print(f"❌ Ошибка генерации кода: {export_response.status_code}")
                print(export_response.text)
        else:
            print(f"❌ Ошибка создания проекта: {create_response.status_code}")
            print(create_response.text)
            
    except Exception as e:
        print(f"❌ Ошибка запроса: {e}")

def analyze_start_handler(code):
    """Анализируем start_handler в сгенерированном коде"""
    print("\n🔍 АНАЛИЗ START_HANDLER:")
    print("-" * 30)
    
    lines = code.split('\n')
    in_start_handler = False
    start_handler_lines = []
    
    for line in lines:
        if 'async def start_handler' in line:
            in_start_handler = True
            start_handler_lines.append(line)
        elif in_start_handler and line.startswith('async def '):
            break
        elif in_start_handler:
            start_handler_lines.append(line)
    
    print("📝 START HANDLER КОД:")
    for i, line in enumerate(start_handler_lines):
        print(f"  {i+1:2d}: {line}")
    
    # Проверяем на наличие parse_mode
    handler_code = '\n'.join(start_handler_lines)
    if 'parse_mode=ParseMode.MARKDOWN' in handler_code:
        print("\n✅ parse_mode=ParseMode.MARKDOWN найден в start_handler")
    else:
        print("\n❌ parse_mode=ParseMode.MARKDOWN НЕ найден в start_handler")
    
    if 'parse_mode=ParseMode.HTML' in handler_code:
        print("✅ parse_mode=ParseMode.HTML найден в start_handler")
    else:
        print("❌ parse_mode=ParseMode.HTML НЕ найден в start_handler")

if __name__ == "__main__":
    test_real_formatting()