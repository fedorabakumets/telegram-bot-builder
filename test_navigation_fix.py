#!/usr/bin/env python3
"""
Тест исправления навигации в комплексном сборе данных
"""
import requests
import json
import time

def test_navigation_fix():
    """Тестирует исправление навигации в пользовательском вводе"""
    
    print("🔧 Тестирование исправления навигации...")
    
    # Создаем новый проект на базе шаблона комплексного сбора данных
    create_response = requests.post("http://localhost:3000/api/projects", json={
        "name": "Тест навигации",
        "description": "Тестовый бот для проверки навигации",
        "templateId": 3  # ID шаблона комплексного сбора данных
    })
    
    if create_response.status_code == 201:
        project = create_response.json()
        project_id = project["id"]
        print(f"✅ Создан проект: {project['name']} (ID: {project_id})")
        
        # Получаем структуру бота
        bot_response = requests.get(f"http://localhost:3000/api/projects/{project_id}")
        if bot_response.status_code == 200:
            bot_data = bot_response.json()
            bot_structure = json.loads(bot_data["botData"])
            
            # Проверяем связи
            connections = bot_structure.get("connections", [])
            name_input_connection = None
            for conn in connections:
                if conn["source"] == "name-input":
                    name_input_connection = conn
                    break
            
            if name_input_connection:
                print(f"✅ Найдена связь: {name_input_connection['source']} -> {name_input_connection['target']}")
                
                # Генерируем код бота
                generate_response = requests.post(f"http://localhost:3000/api/projects/{project_id}/export")
                if generate_response.status_code == 200:
                    export_data = generate_response.json()
                    python_code = export_data["files"]["bot.py"]["content"]
                    
                    # Проверяем, что код содержит навигацию
                    if 'next_node_id = input_config.get("next_node_id")' in python_code:
                        print("✅ Код содержит логику автоматической навигации")
                        
                        # Проверяем, что есть обработчики для всех узлов
                        if "handle_callback_age_buttons" in python_code:
                            print("✅ Обработчик для age-buttons найден")
                        else:
                            print("❌ Обработчик для age-buttons не найден")
                            
                        # Проверяем настройку next_node_id в waiting_for_input
                        if '"next_node_id"' in python_code:
                            print("✅ next_node_id настраивается в waiting_for_input")
                        else:
                            print("❌ next_node_id не настраивается в waiting_for_input")
                            
                        # Сохраняем код для проверки
                        with open(f"test_navigation_bot_{project_id}.py", "w", encoding="utf-8") as f:
                            f.write(python_code)
                        print(f"✅ Код сохранен в test_navigation_bot_{project_id}.py")
                        
                        return True
                    else:
                        print("❌ Код не содержит логику автоматической навигации")
                        return False
                else:
                    print(f"❌ Ошибка генерации кода: {generate_response.status_code}")
                    return False
            else:
                print("❌ Связь name-input не найдена")
                return False
        else:
            print(f"❌ Ошибка получения данных бота: {bot_response.status_code}")
            return False
    else:
        print(f"❌ Ошибка создания проекта: {create_response.status_code}")
        return False

if __name__ == "__main__":
    success = test_navigation_fix()
    if success:
        print("\n🎉 Тест прошел успешно! Навигация должна работать.")
    else:
        print("\n❌ Тест не прошел. Требуется дополнительная отладка.")