#!/usr/bin/env python3
"""
Тест исправленного форматирования
"""

import json
import requests

def create_fixed_formatting_test():
    """Создаем тест с исправленным форматированием"""
    
    bot_data = {
        "nodes": [
            {
                "id": "start-1",
                "type": "start",
                "data": {
                    "command": "/start",
                    # ПРАВИЛЬНО: markdown синтаксис с markdown форматированием
                    "messageText": "Привет! **Добро пожаловать!**",
                    "keyboardType": "inline",
                    "formatMode": "markdown",
                    "buttons": [
                        {
                            "id": "btn-html",
                            "text": "HTML тест",
                            "action": "goto",
                            "target": "html-test"
                        },
                        {
                            "id": "btn-markdown",
                            "text": "Markdown тест",
                            "action": "goto",
                            "target": "markdown-test"
                        }
                    ]
                },
                "position": {"x": 100, "y": 100}
            },
            {
                "id": "html-test",
                "type": "message",
                "data": {
                    # ПРАВИЛЬНО: HTML синтаксис с HTML форматированием
                    "messageText": "Это HTML узел с <b>жирным</b> текстом и <i>курсивом</i>",
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
            },
            {
                "id": "markdown-test",
                "type": "message",
                "data": {
                    # ПРАВИЛЬНО: Markdown синтаксис с markdown форматированием
                    "messageText": "Это Markdown узел с **жирным** текстом и *курсивом*",
                    "keyboardType": "inline",
                    "formatMode": "markdown",
                    "buttons": [
                        {
                            "id": "btn-back-md",
                            "text": "Назад",
                            "action": "goto",
                            "target": "start-1"
                        }
                    ]
                },
                "position": {"x": 300, "y": 200}
            }
        ],
        "connections": [
            {"id": "conn1", "from": "start-1", "to": "html-test"},
            {"id": "conn2", "from": "start-1", "to": "markdown-test"},
            {"id": "conn3", "from": "html-test", "to": "start-1"},
            {"id": "conn4", "from": "markdown-test", "to": "start-1"}
        ]
    }
    
    return bot_data

def test_fixed_formatting():
    """Тестируем исправленное форматирование"""
    
    print("🧪 ТЕСТ ИСПРАВЛЕННОГО ФОРМАТИРОВАНИЯ")
    print("=" * 50)
    
    # Создаём исправленный бот
    bot_data = create_fixed_formatting_test()
    
    # Создаём проект через API
    project_data = {
        "name": "Тест исправленного форматирования",
        "description": "Демонстрация правильного форматирования",
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
                with open('test_fixed_formatting_result.py', 'w', encoding='utf-8') as f:
                    f.write(generated_code)
                
                print("✅ Код сохранён в 'test_fixed_formatting_result.py'")
                
                # Анализируем исправления
                analyze_fixed_formatting(generated_code)
                
                print("\n🎯 РЕЗЮМЕ:")
                print("=" * 30)
                print("✅ Правильное использование:")
                print("   • Markdown синтаксис (**текст**) с formatMode: 'markdown'")
                print("   • HTML синтаксис (<b>текст</b>) с formatMode: 'html'")
                print("❌ Неправильное использование:")
                print("   • HTML теги (<b>текст</b>) с formatMode: 'markdown'")
                print("   • Markdown синтаксис (**текст**) с formatMode: 'html'")
                
            else:
                print(f"❌ Ошибка генерации кода: {export_response.status_code}")
                print(export_response.text)
        else:
            print(f"❌ Ошибка создания проекта: {create_response.status_code}")
            print(create_response.text)
            
    except Exception as e:
        print(f"❌ Ошибка запроса: {e}")

def analyze_fixed_formatting(code):
    """Анализируем исправленное форматирование"""
    
    print("\n🔍 АНАЛИЗ ИСПРАВЛЕННОГО ФОРМАТИРОВАНИЯ:")
    print("-" * 40)
    
    # Подсчитываем parse_mode
    markdown_count = code.count('parse_mode=ParseMode.MARKDOWN')
    html_count = code.count('parse_mode=ParseMode.HTML')
    
    print(f"📊 Найдено parse_mode=ParseMode.MARKDOWN: {markdown_count}")
    print(f"📊 Найдено parse_mode=ParseMode.HTML: {html_count}")
    
    # Проверяем соответствие синтаксиса и parse_mode
    lines = code.split('\n')
    
    # Поиск start_handler
    for i, line in enumerate(lines):
        if 'async def start_handler' in line:
            # Ищем текст
            for j in range(i, min(i + 20, len(lines))):
                if 'text = "' in lines[j] and '**' in lines[j]:
                    print(f"✅ Start handler: Markdown синтаксис найден в строке {j+1}")
                    break
            # Ищем parse_mode
            for j in range(i, min(i + 30, len(lines))):
                if 'parse_mode=ParseMode.MARKDOWN' in lines[j]:
                    print(f"✅ Start handler: ParseMode.MARKDOWN найден в строке {j+1}")
                    break
            break
    
    # Поиск HTML callback
    for i, line in enumerate(lines):
        if 'async def handle_callback_html_test' in line:
            # Ищем текст
            for j in range(i, min(i + 20, len(lines))):
                if 'text = "' in lines[j] and '<b>' in lines[j]:
                    print(f"✅ HTML callback: HTML синтаксис найден в строке {j+1}")
                    break
            # Ищем parse_mode
            for j in range(i, min(i + 30, len(lines))):
                if 'parse_mode=ParseMode.HTML' in lines[j]:
                    print(f"✅ HTML callback: ParseMode.HTML найден в строке {j+1}")
                    break
            break

if __name__ == "__main__":
    test_fixed_formatting()