#!/usr/bin/env python3
"""
Комплексный тест всех видов форматирования
"""

import json
import requests
import sys

def create_comprehensive_formatting_test():
    """Создает комплексный тест форматирования с разными сценариями"""
    
    bot_data = {
        "nodes": [
            {
                "id": "start-1",
                "type": "start",
                "data": {
                    "command": "/start",
                    "messageText": "🎯 **Добро пожаловать в тест форматирования!**\n\n*Выберите тип форматирования:*",
                    "keyboardType": "inline",
                    "formatMode": "markdown",
                    "buttons": [
                        {
                            "id": "btn-markdown",
                            "text": "📝 Markdown",
                            "action": "goto",
                            "target": "markdown-node"
                        },
                        {
                            "id": "btn-html",
                            "text": "🌐 HTML",
                            "action": "goto",
                            "target": "html-node"
                        },
                        {
                            "id": "btn-plain",
                            "text": "📄 Обычный текст",
                            "action": "goto",
                            "target": "plain-node"
                        }
                    ]
                },
                "position": {"x": 100, "y": 100}
            },
            {
                "id": "markdown-node",
                "type": "message",
                "data": {
                    "messageText": "📝 **MARKDOWN ФОРМАТИРОВАНИЕ:**\n\n**Жирный текст**\n*Курсивный текст*\n__Подчеркнутый текст__\n`Код`\n\n~~Зачеркнутый текст~~\n\n• Список\n• Элементов\n\n[Ссылка](https://example.com)",
                    "keyboardType": "inline",
                    "formatMode": "markdown",
                    "buttons": [
                        {
                            "id": "btn-back-md",
                            "text": "◀️ Назад",
                            "action": "goto",
                            "target": "start-1"
                        }
                    ]
                },
                "position": {"x": 400, "y": 50}
            },
            {
                "id": "html-node",
                "type": "message",
                "data": {
                    "messageText": "🌐 <b>HTML ФОРМАТИРОВАНИЕ:</b>\n\n<b>Жирный текст</b>\n<i>Курсивный текст</i>\n<u>Подчеркнутый текст</u>\n<code>Код</code>\n\n<s>Зачеркнутый текст</s>\n\n• Список\n• Элементов\n\n<a href=\"https://example.com\">Ссылка</a>",
                    "keyboardType": "inline",
                    "formatMode": "html",
                    "buttons": [
                        {
                            "id": "btn-back-html",
                            "text": "◀️ Назад",
                            "action": "goto",
                            "target": "start-1"
                        }
                    ]
                },
                "position": {"x": 400, "y": 150}
            },
            {
                "id": "plain-node",
                "type": "message",
                "data": {
                    "messageText": "📄 ОБЫЧНЫЙ ТЕКСТ:\n\nПривет! Это обычный текст без форматирования.\n\nЗдесь нет жирного или курсивного текста.\n\nПросто обычное сообщение.",
                    "keyboardType": "inline",
                    "formatMode": "none",
                    "buttons": [
                        {
                            "id": "btn-back-plain",
                            "text": "◀️ Назад",
                            "action": "goto",
                            "target": "start-1"
                        }
                    ]
                },
                "position": {"x": 400, "y": 250}
            }
        ],
        "connections": [
            {"id": "conn1", "from": "start-1", "to": "markdown-node"},
            {"id": "conn2", "from": "start-1", "to": "html-node"},
            {"id": "conn3", "from": "start-1", "to": "plain-node"},
            {"id": "conn4", "from": "markdown-node", "to": "start-1"},
            {"id": "conn5", "from": "html-node", "to": "start-1"},
            {"id": "conn6", "from": "plain-node", "to": "start-1"}
        ]
    }
    
    return bot_data

def test_comprehensive_formatting():
    """Комплексный тест форматирования"""
    
    print("🧪 КОМПЛЕКСНЫЙ ТЕСТ ФОРМАТИРОВАНИЯ")
    print("=" * 50)
    
    # Создаём тестовый бот
    bot_data = create_comprehensive_formatting_test()
    
    # Создаём проект через API
    project_data = {
        "name": "Комплексный тест форматирования",
        "description": "Тест для проверки всех видов форматирования",
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
                filename = 'comprehensive_formatting_test_RESULT.py'
                with open(filename, 'w', encoding='utf-8') as f:
                    f.write(generated_code)
                
                print(f"✅ Код сохранён в '{filename}'")
                
                # Анализируем код
                analyze_formatting_code(generated_code)
                
            else:
                print(f"❌ Ошибка генерации кода: {export_response.status_code}")
                print(export_response.text)
        else:
            print(f"❌ Ошибка создания проекта: {create_response.status_code}")
            print(create_response.text)
            
    except Exception as e:
        print(f"❌ Ошибка запроса: {e}")

def analyze_formatting_code(code):
    """Анализирует сгенерированный код форматирования"""
    
    print("\n🔍 АНАЛИЗ СГЕНЕРИРОВАННОГО КОДА:")
    print("-" * 40)
    
    # Подсчитываем parse_mode
    markdown_count = code.count('parse_mode=ParseMode.MARKDOWN')
    html_count = code.count('parse_mode=ParseMode.HTML')
    
    print(f"📊 Найдено parse_mode=ParseMode.MARKDOWN: {markdown_count}")
    print(f"📊 Найдено parse_mode=ParseMode.HTML: {html_count}")
    
    # Анализируем start_handler
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
    
    print(f"\n📝 START HANDLER ({len(start_handler_lines)} строк):")
    for i, line in enumerate(start_handler_lines[-10:]):  # Показываем последние 10 строк
        print(f"  {i+1}: {line}")
    
    # Проверяем callback обработчики
    callback_handlers = []
    for line in lines:
        if 'async def handle_callback_' in line:
            callback_handlers.append(line.strip())
    
    print(f"\n🔗 CALLBACK ОБРАБОТЧИКИ ({len(callback_handlers)}):")
    for handler in callback_handlers:
        print(f"  • {handler}")
    
    # Проверяем, есть ли проблемы с форматированием
    has_mixed_formatting = False
    for line in lines:
        if 'parse_mode=ParseMode.MARKDOWN' in line:
            # Ищем HTML теги в окружающем тексте
            line_index = lines.index(line)
            for i in range(max(0, line_index-10), min(len(lines), line_index+10)):
                if '<b>' in lines[i] or '<i>' in lines[i]:
                    has_mixed_formatting = True
                    break
    
    if has_mixed_formatting:
        print("\n⚠️  ПРЕДУПРЕЖДЕНИЕ: Найдено смешанное форматирование!")
        print("    HTML теги используются с Markdown parse_mode")
    else:
        print("\n✅ Форматирование выглядит корректным")

if __name__ == "__main__":
    test_comprehensive_formatting()