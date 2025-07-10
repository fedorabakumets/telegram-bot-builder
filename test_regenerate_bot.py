#!/usr/bin/env python3
"""
Тест перегенерации бота с правильными ID узлов
"""

import requests
import json

def test_bot_regeneration():
    print("🧪 ТЕСТ: Перегенерация кода бота")
    print("=" * 50)
    
    # Получаем актуальные данные проекта
    response = requests.get("http://localhost:5000/api/projects/1")
    if response.status_code != 200:
        print("❌ Ошибка получения проекта")
        return False
        
    project = response.json()
    print(f"✅ Проект получен: {project['name']}")
    
    # Проверяем ID узлов в данных
    nodes = project['data']['nodes']
    node_ids = [node['id'] for node in nodes]
    print(f"📝 ID узлов в проекте: {node_ids}")
    
    # Ожидаемые ID
    expected_ids = ['9q4tb3UOhuqEuYZNuFEFf', 'xtEZ0Z4CUpkWyFNdBLorj', '-0oRrlrqED9ftXHpoJEdO']
    
    # Проверяем соответствие
    if all(expected_id in node_ids for expected_id in expected_ids):
        print("✅ ID узлов в базе правильные")
    else:
        print(f"❌ Неправильные ID. Ожидаемые: {expected_ids}")
        return False
    
    # Генерируем код
    export_response = requests.post("http://localhost:5000/api/projects/1/export")
    if export_response.status_code != 200:
        print(f"❌ Ошибка генерации: {export_response.status_code}")
        return False
        
    generated_code = export_response.json()['code']
    
    # Проверяем callback_data в сгенерированном коде
    found_old_ids = []
    found_new_ids = []
    
    old_ids = ['CWZz-OVozgC0i8qGtR7IQ', '2LsUexBjeVC44ALschZU9', 'ErYb9yOfCTtPNAlJim3C1']
    
    for old_id in old_ids:
        if old_id in generated_code:
            found_old_ids.append(old_id)
            
    for new_id in expected_ids:
        if new_id in generated_code:
            found_new_ids.append(new_id)
    
    print(f"\n🔍 Анализ сгенерированного кода:")
    print(f"Найдены старые ID: {found_old_ids}")
    print(f"Найдены новые ID: {found_new_ids}")
    
    if found_old_ids:
        print("❌ Код содержит старые ID узлов!")
        
        # Сохраняем код для анализа
        with open("debug_generated_code.py", "w", encoding="utf-8") as f:
            f.write(generated_code)
        print("💾 Код сохранен в debug_generated_code.py")
        
        return False
    elif found_new_ids:
        print("✅ Код содержит правильные ID узлов!")
        return True
    else:
        print("⚠️ ID узлов не найдены в коде")
        return False

if __name__ == "__main__":
    test_bot_regeneration()