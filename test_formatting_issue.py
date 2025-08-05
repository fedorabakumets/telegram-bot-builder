#!/usr/bin/env python3
"""
Тест для выявления и исправления проблем с форматированием текста
"""

import json
import requests

def create_test_bot():
    """Создаём тестовый бот для проверки форматирования"""
    
    bot_data = {
        "nodes": [
            {
                "id": "start-1",
                "type": "start",
                "data": {
                    "command": "/start",
                    "messageText": "🤖 **Тест форматирования**\n\n**Жирный текст** должен быть жирным\n*Курсивный текст* должен быть курсивом\n`Код` должен быть кодом\n__Подчеркнутый__ должен быть подчеркнутым\n~~Зачеркнутый~~ должен быть зачеркнутым",
                    "keyboardType": "inline",
                    "formatMode": "markdown",
                    "buttons": [
                        {
                            "id": "btn-html",
                            "text": "🌐 HTML тест",
                            "action": "goto",
                            "target": "html-test"
                        },
                        {
                            "id": "btn-plain",
                            "text": "📝 Обычный текст",
                            "action": "goto",
                            "target": "plain-test"
                        }
                    ]
                },
                "position": {"x": 100, "y": 100}
            },
            {
                "id": "html-test",
                "type": "message",
                "data": {
                    "messageText": "🌐 <b>HTML Форматирование</b>\n\n<b>Жирный</b> в HTML\n<i>Курсивный</i> в HTML\n<code>Код</code> в HTML\n<u>Подчеркнутый</u> в HTML\n<s>Зачеркнутый</s> в HTML",
                    "keyboardType": "inline",
                    "formatMode": "html",
                    "buttons": [
                        {
                            "id": "btn-back",
                            "text": "🔙 Назад",
                            "action": "goto",
                            "target": "start-1"
                        }
                    ]
                },
                "position": {"x": 300, "y": 100}
            },
            {
                "id": "plain-test",
                "type": "message",
                "data": {
                    "messageText": "📝 Обычный текст без форматирования\n\n**Это не должно быть жирным**\n*Это не должно быть курсивом*\n`Это не должно быть кодом`",
                    "keyboardType": "inline",
                    "formatMode": "none",
                    "buttons": [
                        {
                            "id": "btn-back2",
                            "text": "🔙 Назад",
                            "action": "goto",
                            "target": "start-1"
                        }
                    ]
                },
                "position": {"x": 500, "y": 100}
            }
        ],
        "connections": [
            {"id": "conn1", "from": "start-1", "to": "html-test"},
            {"id": "conn2", "from": "start-1", "to": "plain-test"},
            {"id": "conn3", "from": "html-test", "to": "start-1"},
            {"id": "conn4", "from": "plain-test", "to": "start-1"}
        ]
    }
    
    return bot_data

def test_code_generation():
    """Тестируем генерацию кода через API"""
    
    print("🧪 ТЕСТ ФОРМАТИРОВАНИЯ: Создание и генерация кода")
    print("=" * 60)
    
    # Создаём тестовый бот
    bot_data = create_test_bot()
    
    # Создаём проект через API
    project_data = {
        "name": "Тест форматирования",
        "description": "Тест для проверки форматирования текста",
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
                with open('generated_formatting_test.py', 'w', encoding='utf-8') as f:
                    f.write(generated_code)
                
                print("✅ Код успешно сгенерирован и сохранён в 'generated_formatting_test.py'")
                
                # Анализируем код на предмет проблем
                analyze_generated_code(generated_code)
                
            else:
                print(f"❌ Ошибка генерации кода: {export_response.status_code}")
                print(export_response.text)
        else:
            print(f"❌ Ошибка создания проекта: {create_response.status_code}")
            print(create_response.text)
            
    except Exception as e:
        print(f"❌ Ошибка запроса: {e}")

def analyze_generated_code(code):
    """Анализируем сгенерированный код на предмет проблем"""
    print("\n🔍 АНАЛИЗ СГЕНЕРИРОВАННОГО КОДА:")
    print("-" * 40)
    
    issues = []
    
    # Ищем проблемы с экранированием
    if '\\"' in code:
        issues.append("⚠️  Найдены экранированные кавычки в тексте")
    
    # Ищем правильное использование parseMode
    if 'parse_mode=ParseMode.MARKDOWN' in code:
        print("✅ Найден ParseMode.MARKDOWN")
    else:
        issues.append("❌ Не найден ParseMode.MARKDOWN")
    
    if 'parse_mode=ParseMode.HTML' in code:
        print("✅ Найден ParseMode.HTML")
    else:
        issues.append("❌ Не найден ParseMode.HTML")
    
    # Ищем проблемы с тройными кавычками
    if '"""' in code:
        print("✅ Найдены тройные кавычки для многострочного текста")
    
    # Ищем проблемы с экранированием markdown
    if '\\*\\*' in code:
        issues.append("❌ Найдено неправильное экранирование markdown (\\*\\*)")
    
    if '\\*' in code and '\\*\\*' not in code:
        issues.append("❌ Найдено неправильное экранирование курсива (\\*)")
    
    # Проверяем правильность форматирования
    lines = code.split('\n')
    for i, line in enumerate(lines):
        if '**' in line and 'text = ' in line:
            if '\\"' in line:
                issues.append(f"❌ Строка {i+1}: неправильное экранирование markdown с жирным текстом")
            else:
                print(f"✅ Строка {i+1}: правильное форматирование жирного текста")
    
    # Выводим найденные проблемы
    if issues:
        print("\n🚨 НАЙДЕННЫЕ ПРОБЛЕМЫ:")
        for issue in issues:
            print(f"  {issue}")
    else:
        print("\n✅ Проблем с форматированием не найдено!")

if __name__ == "__main__":
    test_code_generation()