#!/usr/bin/env python3
"""
Тест для воспроизведения проблемы пользователя
"""

import json
import requests

def create_user_problem_test():
    """Создаем тест, который воспроизводит проблему пользователя"""
    
    print("🧪 ВОСПРОИЗВЕДЕНИЕ ПРОБЛЕМЫ ПОЛЬЗОВАТЕЛЯ")
    print("=" * 45)
    
    # Точно такие же данные как в политическом шаблоне
    bot_data = {
        "nodes": [
            {
                "id": "start-1",
                "type": "start",
                "data": {
                    "command": "/start",
                    "messageText": "🏛️ **ДОБРО ПОЖАЛОВАТЬ В УЛЬТРА-КОМПЛЕКСНЫЙ ПОЛИТИКО-ИСТОРИЧЕСКИЙ ОПРОС!**\n\n📚 Этот опрос включает:\n• 🗳️ **Политические взгляды** (20+ вопросов)\n• 📜 **Историческое знание** (25+ вопросов)\n• 🤔 **Философские воззрения** (15+ вопросов)\n• 🌍 **Социологический анализ** (20+ вопросов)\n\n⏱️ **Время прохождения:** 45-60 минут\n🎯 **Результат:** Подробный анализ ваших взглядов\n\n**Готовы начать глубокое исследование?**",
                    "keyboardType": "inline",
                    "markdown": True,  # Как в шаблоне
                    # formatMode отсутствует как в шаблоне
                    "buttons": [
                        {
                            "id": "btn-start",
                            "text": "🚀 Начать опрос",
                            "action": "goto",
                            "target": "question-1"
                        }
                    ]
                },
                "position": {"x": 100, "y": 100}
            },
            {
                "id": "question-1",
                "type": "message",
                "data": {
                    "messageText": "**Вопрос 1:** Какова ваша политическая позиция?",
                    "keyboardType": "inline",
                    "markdown": True,
                    "buttons": [
                        {
                            "id": "btn-left",
                            "text": "Левые взгляды",
                            "action": "goto",
                            "target": "start-1"
                        },
                        {
                            "id": "btn-right",
                            "text": "Правые взгляды",
                            "action": "goto",
                            "target": "start-1"
                        }
                    ]
                },
                "position": {"x": 400, "y": 100}
            }
        ],
        "connections": [
            {"id": "conn1", "from": "start-1", "to": "question-1"},
            {"id": "conn2", "from": "question-1", "to": "start-1"}
        ]
    }
    
    # Создаём проект через API
    project_data = {
        "name": "Проблема пользователя - markdown не работает",
        "description": "Тест проблемы с markdown форматированием",
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
                with open('test_user_problem_result.py', 'w', encoding='utf-8') as f:
                    f.write(generated_code)
                
                print("✅ Код сохранён в 'test_user_problem_result.py'")
                
                # Анализируем результат
                analyze_user_problem(generated_code)
                
            else:
                print(f"❌ Ошибка генерации кода: {export_response.status_code}")
                print(export_response.text)
        else:
            print(f"❌ Ошибка создания проекта: {create_response.status_code}")
            print(create_response.text)
            
    except Exception as e:
        print(f"❌ Ошибка запроса: {e}")

def test_user_problem():
    """Тестируем проблему пользователя"""
    create_user_problem_test()

def analyze_user_problem(code):
    """Анализируем проблему пользователя в коде"""
    
    print("\n🔍 АНАЛИЗ ПРОБЛЕМЫ ПОЛЬЗОВАТЕЛЯ:")
    print("-" * 40)
    
    lines = code.split('\n')
    
    # Ищем проблему в start_handler
    for i, line in enumerate(lines):
        if 'async def start_handler' in line:
            print(f"📍 Найден start_handler на строке {i+1}")
            
            # Анализируем следующие 30 строк
            for j in range(i, min(i + 30, len(lines))):
                if 'text = ' in lines[j] and '**' in lines[j]:
                    print(f"📝 Найден markdown текст на строке {j+1}:")
                    print(f"   {lines[j].strip()}")
                    
                    # Ищем parse_mode в следующих строках
                    for k in range(j, min(j + 10, len(lines))):
                        if 'parse_mode=' in lines[k]:
                            print(f"📊 Parse mode на строке {k+1}: {lines[k].strip()}")
                            
                            if 'ParseMode.MARKDOWN' in lines[k]:
                                print("✅ ПРАВИЛЬНО: Markdown синтаксис с ParseMode.MARKDOWN")
                            elif 'ParseMode.HTML' in lines[k]:
                                print("❌ ПРОБЛЕМА: Markdown синтаксис с ParseMode.HTML")
                            else:
                                print("❓ НЕОПРЕДЕЛЕННО: Неизвестный parse mode")
                            break
                    break
            break
    
    # Проверяем общую логику formatMode
    print(f"\n📊 АНАЛИЗ ЛОГИКИ FORMATMODE:")
    if 'formatMode' in code:
        print("✅ formatMode присутствует в коде")
    else:
        print("❌ formatMode отсутствует в коде")
    
    if 'markdown: true' in code or 'markdown: True' in code:
        print("✅ Обнаружен markdown: true")
    else:
        print("❌ markdown: true не найден")
    
    # Подсчитываем parse modes
    html_modes = code.count('ParseMode.HTML')
    markdown_modes = code.count('ParseMode.MARKDOWN')
    
    print(f"\n📊 СТАТИСТИКА PARSE MODES:")
    print(f"   ParseMode.HTML: {html_modes}")
    print(f"   ParseMode.MARKDOWN: {markdown_modes}")
    
    if markdown_modes > 0:
        print("✅ Markdown parse mode используется")
    else:
        print("❌ Markdown parse mode НЕ используется")

if __name__ == "__main__":
    test_user_problem()