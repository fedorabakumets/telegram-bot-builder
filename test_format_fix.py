#!/usr/bin/env python3
"""
Тест исправления автоматического переключения formatMode
"""

import json
import requests

def test_format_fix():
    """Тестируем исправление автоматического переключения formatMode"""
    
    print("🧪 ТЕСТ ИСПРАВЛЕНИЯ АВТОМАТИЧЕСКОГО ПЕРЕКЛЮЧЕНИЯ FORMATMODE")
    print("=" * 65)
    
    # Создаём тестовый бот с проблемой (HTML в markdown режиме)
    bot_data = {
        "nodes": [
            {
                "id": "start-1",
                "type": "start",
                "data": {
                    "command": "/start",
                    "messageText": "Привет! <b>Добро пожаловать!</b> Это <i>тест</i>.",
                    "keyboardType": "inline",
                    "formatMode": "markdown",  # Здесь проблема
                    "buttons": [
                        {
                            "id": "btn-test",
                            "text": "Тест",
                            "action": "goto",
                            "target": "test-node"
                        }
                    ]
                },
                "position": {"x": 100, "y": 100}
            },
            {
                "id": "test-node",
                "type": "message",
                "data": {
                    "messageText": "Это тестовое сообщение",
                    "keyboardType": "inline",
                    "formatMode": "markdown",
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
            {"id": "conn1", "from": "start-1", "to": "test-node"},
            {"id": "conn2", "from": "test-node", "to": "start-1"}
        ]
    }
    
    # Создаём проект через API
    project_data = {
        "name": "Тест исправления formatMode",
        "description": "Тестируем автоматическое переключение в HTML режим",
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
                with open('test_format_fix_result.py', 'w', encoding='utf-8') as f:
                    f.write(generated_code)
                
                print("✅ Код сохранён в 'test_format_fix_result.py'")
                
                # Анализируем результат
                analyze_format_fix(generated_code)
                
            else:
                print(f"❌ Ошибка генерации кода: {export_response.status_code}")
                print(export_response.text)
        else:
            print(f"❌ Ошибка создания проекта: {create_response.status_code}")
            print(create_response.text)
            
    except Exception as e:
        print(f"❌ Ошибка запроса: {e}")

def analyze_format_fix(code):
    """Анализируем результат исправления"""
    
    print("\n🔍 АНАЛИЗ ИСПРАВЛЕНИЯ:")
    print("-" * 30)
    
    # Ищем start_handler
    lines = code.split('\n')
    
    for i, line in enumerate(lines):
        if 'async def start_handler' in line:
            print(f"📍 Найден start_handler на строке {i+1}")
            
            # Ищем текст сообщения
            text_line = -1
            parse_mode_line = -1
            
            for j in range(i, min(i + 30, len(lines))):
                if 'text = "' in lines[j]:
                    text_line = j
                    print(f"📝 Текст: {lines[j].strip()}")
                    
                    # Проверяем наличие HTML тегов
                    if '<b>' in lines[j] or '<i>' in lines[j]:
                        print("🔍 Найдены HTML теги в тексте")
                        
                if 'parse_mode=ParseMode.' in lines[j]:
                    parse_mode_line = j
                    print(f"📊 Parse mode: {lines[j].strip()}")
                    
                    # Проверяем соответствие
                    if 'ParseMode.HTML' in lines[j]:
                        print("✅ ИСПРАВЛЕНИЕ РАБОТАЕТ: HTML теги с ParseMode.HTML")
                    elif 'ParseMode.MARKDOWN' in lines[j]:
                        print("❌ ПРОБЛЕМА ОСТАЛАСЬ: HTML теги с ParseMode.MARKDOWN")
                        
            break
    
    # Подсчитываем статистику
    html_count = code.count('parse_mode=ParseMode.HTML')
    markdown_count = code.count('parse_mode=ParseMode.MARKDOWN')
    
    print(f"\n📊 СТАТИСТИКА:")
    print(f"   HTML режим: {html_count} использований")
    print(f"   Markdown режим: {markdown_count} использований")
    
    if html_count > 0:
        print("✅ Система использует HTML режим")
    else:
        print("❌ HTML режим не используется")

if __name__ == "__main__":
    test_format_fix()