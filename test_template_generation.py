#!/usr/bin/env python3
import json
import requests
import sys

def test_template_generation():
    """Тестируем генерацию кода из шаблона"""
    
    # Получаем данные шаблона
    try:
        response = requests.get('http://localhost:5000/api/templates/10')
        if response.status_code != 200:
            print(f"Ошибка получения шаблона: {response.status_code}")
            return False
            
        template_data = response.json()
        print(f"Шаблон загружен: {template_data['name']}")
        
        # Создаем тестовый проект
        project_data = {
            "name": "Test Shop Bot",
            "description": "Тест интерактивного магазина",
            "data": template_data['data']
        }
        
        # Создаем проект
        create_response = requests.post('http://localhost:5000/api/projects', json=project_data)
        if create_response.status_code not in [200, 201]:
            print(f"Ошибка создания проекта: {create_response.status_code}")
            return False
            
        project = create_response.json()
        project_id = project['id']
        print(f"Проект создан с ID: {project_id}")
        
        # Генерируем код бота
        export_response = requests.post(f'http://localhost:5000/api/projects/{project_id}/export')
        if export_response.status_code != 200:
            print(f"Ошибка экспорта: {export_response.status_code}")
            print(f"Ответ: {export_response.text}")
            return False
            
        bot_code = export_response.json()
        print("Код бота сгенерирован успешно")
        
        # Сохраняем код для анализа
        with open('generated_shop_bot.py', 'w', encoding='utf-8') as f:
            f.write(bot_code['code'])
        
        print("Код сохранен в generated_shop_bot.py")
        
        # Анализируем код на предмет кнопок
        analyze_buttons(bot_code['code'])
        
        return True
        
    except Exception as e:
        print(f"Ошибка тестирования: {e}")
        return False

def analyze_buttons(code):
    """Анализируем кнопки в сгенерированном коде"""
    print("\n=== АНАЛИЗ КНОПОК ===")
    
    lines = code.split('\n')
    button_lines = [line for line in lines if 'InlineKeyboardButton' in line and 'callback_data' in line]
    
    print(f"Найдено {len(button_lines)} кнопок:")
    for i, line in enumerate(button_lines[:10], 1):  # Показываем первые 10
        print(f"{i}. {line.strip()}")
    
    # Ищем обработчики callback
    callback_handlers = [line for line in lines if '@dp.callback_query' in line]
    print(f"\nНайдено {len(callback_handlers)} обработчиков callback:")
    for i, line in enumerate(callback_handlers[:10], 1):
        print(f"{i}. {line.strip()}")
    
    # Проверяем соответствие callback_data и обработчиков
    print("\n=== ПРОБЛЕМЫ ===")
    callback_data_values = set()
    for line in button_lines:
        if 'callback_data="' in line:
            start = line.find('callback_data="') + 15
            end = line.find('"', start)
            if end > start:
                callback_data_values.add(line[start:end])
    
    handled_callbacks = set()
    for line in callback_handlers:
        if 'c.data ==' in line:
            start = line.find('c.data == "') + 11
            end = line.find('"', start)
            if end > start:
                handled_callbacks.add(line[start:end])
    
    unhandled = callback_data_values - handled_callbacks
    if unhandled:
        print(f"Необрабатываемые callback_data: {unhandled}")
    else:
        print("Все callback_data имеют обработчики!")

if __name__ == "__main__":
    success = test_template_generation()
    sys.exit(0 if success else 1)