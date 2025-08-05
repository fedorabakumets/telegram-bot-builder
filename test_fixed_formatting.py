#!/usr/bin/env python3
"""
Тест исправленного форматирования
"""

import json
import requests

def create_fixed_formatting_test():
    """Создаем тест с исправленным форматированием"""
    
    print("🧪 ТЕСТ ИСПРАВЛЕННОГО ФОРМАТИРОВАНИЯ")
    print("=" * 40)
    
    # Создаём тестовый узел где пользователь использует HTML форматирование
    bot_data = {
        "nodes": [
            {
                "id": "start-1",
                "type": "start",
                "data": {
                    "command": "/start",
                    "messageText": "Привет! <b>Добро пожаловать!</b> Это <i>тест</i> с <u>HTML</u> форматированием.",
                    "keyboardType": "inline",
                    "markdown": False,
                    "formatMode": "html",  # Пользователь нажал кнопку форматирования
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
                    "messageText": "Это <strong>жирный</strong> текст и <em>курсивный</em>",
                    "keyboardType": "inline",
                    "markdown": False,
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
            {"id": "conn1", "from": "start-1", "to": "test-node"},
            {"id": "conn2", "from": "test-node", "to": "start-1"}
        ]
    }
    
    # Создаём проект через API
    project_data = {
        "name": "Тест исправленного форматирования",
        "description": "Проверяем что HTML теги работают с правильным parse mode",
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
                
                # Анализируем результат
                analyze_fixed_formatting(generated_code)
                
            else:
                print(f"❌ Ошибка генерации кода: {export_response.status_code}")
                print(export_response.text)
        else:
            print(f"❌ Ошибка создания проекта: {create_response.status_code}")
            print(create_response.text)
            
    except Exception as e:
        print(f"❌ Ошибка запроса: {e}")

def test_fixed_formatting():
    """Тестируем исправленное форматирование"""
    create_fixed_formatting_test()

def analyze_fixed_formatting(code):
    """Анализируем исправленное форматирование"""
    
    print("\n🔍 АНАЛИЗ ИСПРАВЛЕННОГО ФОРМАТИРОВАНИЯ:")
    print("-" * 40)
    
    lines = code.split('\n')
    
    # Ищем start_handler
    for i, line in enumerate(lines):
        if 'async def start_handler' in line:
            print(f"📍 Найден start_handler на строке {i+1}")
            
            # Анализируем следующие 30 строк
            for j in range(i, min(i + 30, len(lines))):
                if 'text = ' in lines[j] and ('<b>' in lines[j] or '<i>' in lines[j] or '<u>' in lines[j]):
                    print(f"📝 Найден HTML текст на строке {j+1}:")
                    print(f"   {lines[j].strip()}")
                    
                    # Ищем parse_mode в следующих строках
                    for k in range(j, min(j + 10, len(lines))):
                        if 'parse_mode=ParseMode.' in lines[k]:
                            print(f"📊 Parse mode на строке {k+1}: {lines[k].strip()}")
                            
                            if 'ParseMode.HTML' in lines[k]:
                                print("✅ ИСПРАВЛЕНО: HTML теги с ParseMode.HTML")
                            elif 'ParseMode.MARKDOWN' in lines[k]:
                                print("❌ ПРОБЛЕМА: HTML теги с ParseMode.MARKDOWN")
                            break
                    break
            break
    
    # Подсчитываем общую статистику
    html_texts = 0
    markdown_texts = 0
    
    for line in lines:
        if 'text = ' in line:
            if '<b>' in line or '<i>' in line or '<u>' in line or '<strong>' in line or '<em>' in line:
                html_texts += 1
            if '**' in line or '*' in line or '__' in line:
                markdown_texts += 1
    
    html_modes = code.count('parse_mode=ParseMode.HTML')
    markdown_modes = code.count('parse_mode=ParseMode.MARKDOWN')
    
    print(f"\n📊 ОБЩАЯ СТАТИСТИКА:")
    print(f"   HTML текстов: {html_texts}")
    print(f"   Markdown текстов: {markdown_texts}")
    print(f"   ParseMode.HTML: {html_modes}")
    print(f"   ParseMode.MARKDOWN: {markdown_modes}")
    
    if html_texts > 0 and html_modes > 0:
        print("✅ HTML тексты используют правильный parse mode")
    elif html_texts > 0 and markdown_modes > 0:
        print("❌ ПРОБЛЕМА: HTML тексты с markdown parse mode")
    else:
        print("❓ Нет HTML текстов для анализа")

if __name__ == "__main__":
    test_fixed_formatting()