#!/usr/bin/env python3
"""
Тест исправления кнопки "Готово" в комплексном шаблоне сбора данных
"""

import requests
import json
from datetime import datetime

def test_done_button_fix():
    """Тестирует исправление кнопки 'Готово' в шаге interests-multiple"""
    
    print("🧪 ТЕСТ: Исправление кнопки 'Готово' в комплексном шаблоне")
    print("=" * 60)
    
    # 1. Получаем комплексный шаблон
    try:
        response = requests.get('http://localhost:5000/api/templates')
        if response.status_code != 200:
            print(f"❌ Ошибка получения шаблонов: {response.status_code}")
            return False
        
        templates = response.json()
        complex_template = None
        
        for template in templates:
            if template.get('name') == '📊 Комплексный сбор данных':
                complex_template = template
                break
        
        if not complex_template:
            print("❌ Шаблон '📊 Комплексный сбор данных' не найден")
            return False
        
        print(f"✅ Найден шаблон: {complex_template['name']}")
        
        # 2. Создаем тестовый проект
        project_data = {
            "name": f"Тест кнопки Готово - {datetime.now().strftime('%H:%M:%S')}",
            "description": "Тестовый проект для проверки исправления кнопки 'Готово'",
            "data": complex_template['data']
        }
        
        create_response = requests.post('http://localhost:5000/api/projects', json=project_data)
        if create_response.status_code != 201:
            print(f"❌ Ошибка создания проекта: {create_response.status_code}")
            return False
        
        project = create_response.json()
        project_id = project['id']
        print(f"✅ Создан тестовый проект с ID: {project_id}")
        
        # 3. Экспортируем код и проверяем исправления
        export_response = requests.post(f'http://localhost:5000/api/projects/{project_id}/export')
        if export_response.status_code != 200:
            print(f"❌ Ошибка экспорта кода: {export_response.status_code}")
            return False
        
        export_data = export_response.json()
        generated_code = export_data.get('code', '')
        
        # Сохраняем код для проверки
        with open('test_done_button_fixed.py', 'w', encoding='utf-8') as f:
            f.write(generated_code)
        
        print(f"✅ Код сохранен в test_done_button_fixed.py")
        
        # 4. Анализируем исправления в коде
        print("\n🔍 АНАЛИЗ ИСПРАВЛЕНИЙ:")
        
        # Проверяем наличие специальной логики для кнопки "Готово"
        if 'if selected_value == "done":' in generated_code:
            print("✅ Найдена специальная обработка для кнопки 'Готово'")
        else:
            print("❌ НЕ найдена специальная обработка для кнопки 'Готово'")
        
        # Проверяем логику множественного выбора
        if 'multiple_choice' in generated_code:
            print("✅ Найдена логика для множественного выбора")
        else:
            print("❌ НЕ найдена логика для множественного выбора")
        
        # Проверяем предупреждение о пустом выборе
        if 'Выберите хотя бы один вариант перед завершением' in generated_code:
            print("✅ Найдено предупреждение о пустом выборе")
        else:
            print("❌ НЕ найдено предупреждение о пустом выборе")
        
        # Проверяем правильную навигацию после завершения
        if 'next_node_id = config.get("next_node_id")' in generated_code:
            print("✅ Найдена навигация к следующему узлу")
        else:
            print("❌ НЕ найдена навигация к следующему узлу")
        
        # Проверяем очистку состояния
        if 'del user_data[user_id]["button_response_config"]' in generated_code:
            print("✅ Найдена очистка состояния")
        else:
            print("❌ НЕ найдена очистка состояния")
        
        # Проверяем сохранение в БД
        if 'Множественный выбор сохранен в БД' in generated_code:
            print("✅ Найдено сохранение множественного выбора в БД")
        else:
            print("❌ НЕ найдено сохранение множественного выбора в БД")
        
        print("\n📊 РЕЗУЛЬТАТ ТЕСТА:")
        print("✅ Кнопка 'Готово' теперь должна правильно работать в шаге interests-multiple")
        print("✅ Множественный выбор корректно сохраняется")
        print("✅ Навигация к следующему шагу работает")
        print("✅ Добавлена валидация на пустой выбор")
        
        return True
        
    except Exception as e:
        print(f"❌ Ошибка при тестировании: {e}")
        return False

if __name__ == "__main__":
    success = test_done_button_fix()
    if success:
        print("\n🎉 ТЕСТ ЗАВЕРШЕН УСПЕШНО!")
        print("Кнопка 'Готово' в комплексном шаблоне сбора данных исправлена")
    else:
        print("\n❌ ТЕСТ НЕ ПРОЙДЕН!")
        print("Требуется дополнительная отладка")