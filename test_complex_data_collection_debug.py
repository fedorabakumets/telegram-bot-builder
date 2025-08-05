"""
Тест комплексного шаблона сбора данных для диагностики проблемы с переходами
"""
import requests
import json

def test_complex_template_creation():
    """Создает проект из комплексного шаблона и анализирует код"""
    
    # 1. Получаем комплексный шаблон
    try:
        response = requests.get('http://localhost:5000/api/templates')
        if response.status_code != 200:
            print(f"❌ Ошибка получения шаблонов: {response.status_code}")
            return
            
        templates = response.json()
        complex_template = None
        
        for template in templates:
            if template.get('name') == '📊 Комплексный сбор данных':
                complex_template = template
                break
        
        if not complex_template:
            print("❌ Шаблон '📊 Комплексный сбор данных' не найден")
            return
        
        print(f"✅ Найден шаблон: {complex_template['name']}")
        
        # 2. Создаем проект из шаблона
        project_data = {
            "name": "Тест комплексного сбора данных - DEBUG",
            "description": "Тестовый проект для диагностики проблемы с переходами",
            "data": complex_template['data']  # Используем данные из шаблона
        }
        
        create_response = requests.post('http://localhost:5000/api/projects', json=project_data)
        if create_response.status_code != 201:
            print(f"❌ Ошибка создания проекта: {create_response.status_code}")
            print(create_response.text)
            return
        
        project = create_response.json()
        project_id = project['id']
        print(f"✅ Проект создан с ID: {project_id}")
        
        # 3. Получаем сгенерированный код
        export_response = requests.post(f'http://localhost:5000/api/projects/{project_id}/export')
        if export_response.status_code != 200:
            print(f"❌ Ошибка экспорта: {export_response.status_code}")
            return
        
        export_data = export_response.json()
        generated_code = export_data.get('code', '')
        
        # 4. Сохраняем код для анализа
        with open('complex_data_collection_debug.py', 'w', encoding='utf-8') as f:
            f.write(generated_code)
        
        print("✅ Код сохранен в файл: complex_data_collection_debug.py")
        
        # 5. Анализируем проблемные места
        print("\n🔍 АНАЛИЗ КОДА:")
        
        # Проверяем callback обработчик для name-input
        if 'handle_callback_name_input' in generated_code:
            print("✅ Найден callback обработчик для name-input")
        else:
            print("❌ НЕ найден callback обработчик для name-input")
        
        # Проверяем обработчик пользовательского ввода
        if 'handle_user_input' in generated_code:
            print("✅ Найден универсальный обработчик пользовательского ввода")
        else:
            print("❌ НЕ найден универсальный обработчик пользовательского ввода")
        
        # Проверяем настройку waiting_for_input
        if 'waiting_for_input' in generated_code:
            print("✅ Найдена настройка состояния waiting_for_input")
        else:
            print("❌ НЕ найдена настройка состояния waiting_for_input")
        
        # Проверяем навигацию к age-buttons
        if 'age-buttons' in generated_code:
            print("✅ Найдено упоминание узла age-buttons")
        else:
            print("❌ НЕ найдено упоминание узла age-buttons")
        
        # Проверяем next_node_id в конфигурации
        if 'next_node_id' in generated_code:
            print("✅ Найдена настройка next_node_id для навигации")
        else:
            print("❌ НЕ найдена настройка next_node_id для навигации")
        
        return project_id
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return None

if __name__ == "__main__":
    print("🧪 ТЕСТ: Диагностика комплексного шаблона сбора данных")
    print("=" * 60)
    
    project_id = test_complex_template_creation()
    
    if project_id:
        print(f"\n✅ Тест завершен. Проект ID: {project_id}")
        print("📂 Проверьте файл 'complex_data_collection_debug.py' для детального анализа")
    else:
        print("\n❌ Тест не удался")