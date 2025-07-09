"""
Тестирование генерации кода из базового шаблона кнопочных ответов
"""

import requests
import json

def test_template_generation(template_id=8, test_count=3):
    """Тестирует генерацию кода из шаблона несколько раз"""
    
    for test_num in range(1, test_count + 1):
        print(f"\n🧪 Тест #{test_num} - Генерация из шаблона ID {template_id}")
        
        try:
            # Получаем шаблон
            print("📥 Получение шаблона...")
            response = requests.get(f"http://localhost:5000/api/templates/{template_id}")
            
            if response.status_code != 200:
                print(f"❌ Ошибка получения шаблона: {response.status_code}")
                continue
                
            template = response.json()
            print(f"✅ Шаблон получен: {template['name']}")
            
            # Создаем проект из шаблона
            print("🔄 Создание проекта из шаблона...")
            
            project_data = {
                "name": f"Тест шаблона #{test_num}",
                "description": f"Автоматический тест генерации #{test_num}",
                "data": template['data']
            }
            
            response = requests.post(
                "http://localhost:5000/api/projects",
                json=project_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 201:
                print(f"❌ Ошибка создания проекта: {response.status_code} - {response.text}")
                continue
                
            project = response.json()
            project_id = project['id']
            print(f"✅ Проект создан с ID: {project_id}")
            
            # Генерируем код
            print("⚙️ Генерация Python кода...")
            
            response = requests.post(f"http://localhost:5000/api/projects/{project_id}/export")
            
            if response.status_code != 200:
                print(f"❌ Ошибка генерации кода: {response.status_code}")
                continue
                
            export_data = response.json()
            python_code = export_data.get('code', '')
            
            if not python_code:
                print("❌ Код не сгенерирован")
                continue
                
            print("✅ Код успешно сгенерирован!")
            
            # Сохраняем код
            filename = f"template_test_{test_num}_bot_{project_id}.py"
            with open(filename, "w", encoding="utf-8") as f:
                f.write(python_code)
            
            print(f"💾 Код сохранен в {filename}")
            
            # Анализируем код
            analysis_results = analyze_generated_code(python_code, test_num)
            
            if all(analysis_results.values()):
                print("🎉 Все проверки пройдены!")
            else:
                print("⚠️ Некоторые проверки не пройдены")
                for check, result in analysis_results.items():
                    status = "✅" if result else "❌"
                    print(f"  {status} {check}")
            
        except Exception as e:
            print(f"❌ Ошибка в тесте #{test_num}: {e}")

def analyze_generated_code(code, test_num):
    """Анализирует сгенерированный код"""
    
    print(f"\n🔍 Анализ кода теста #{test_num}:")
    
    checks = {
        "Обработчик пользовательского ввода": "handle_user_input" in code,
        "Обработка кнопочных ответов": "button_response_config" in code,
        "Поддержка множественного выбора": "allow_multiple" in code,
        "Сохранение в базу данных": "save_user_to_db" in code or "update_user_data_in_db" in code,
        "Поддержка inline кнопок": "InlineKeyboardMarkup" in code and "InlineKeyboardButton" in code,
        "Callback обработчики": "async def handle_callback_" in code,
        "Валидация ответов": "response_data" in code,
        "Структурированное сохранение": "timestamp" in code and "nodeId" in code,
        "Обработка одиночного выбора": "allowMultipleSelection" in code or "allow_multiple_selection" in code,
        "responseOptions обработка": "responseOptions" in code or "response_options" in code
    }
    
    for check, result in checks.items():
        status = "✅" if result else "❌"
        print(f"  {status} {check}")
    
    # Подсчитываем статистику
    callback_count = code.count("async def handle_callback_")
    user_input_count = code.count("user-input")
    button_count = code.count("InlineKeyboardButton")
    
    print(f"\n📊 Статистика:")
    print(f"  🔗 Callback обработчиков: {callback_count}")
    print(f"  📝 Упоминаний user-input: {user_input_count}")
    print(f"  🔘 Inline кнопок: {button_count}")
    
    return checks

def run_comprehensive_test():
    """Запускает комплексное тестирование"""
    
    print("🚀 Начинаем комплексное тестирование генерации кода")
    print("=" * 60)
    
    # Тестируем новый базовый шаблон кнопочных ответов
    test_template_generation(template_id=8, test_count=3)
    
    print("\n" + "=" * 60)
    print("🏁 Комплексное тестирование завершено!")

if __name__ == "__main__":
    run_comprehensive_test()