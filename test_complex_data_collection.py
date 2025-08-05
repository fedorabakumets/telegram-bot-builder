#!/usr/bin/env python3
"""
Тест шаблона "📊 Комплексный сбор данных"
Проверяет генерацию кода для реального бота и превью
"""
import requests
import json
from datetime import datetime

def test_complex_data_collection_template():
    """Тестирует шаблон комплексного сбора данных"""
    
    # Получаем шаблон из API
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
        print(f"📝 Описание: {complex_template['description']}")
        print(f"🔧 Сложность: {complex_template['difficulty']}")
        print(f"⏱️ Расчетное время: {complex_template['estimatedTime']} минут")
        
        # Создаем тестовый проект с этим шаблоном
        project_data = {
            "name": f"Тест комплексного сбора данных - {datetime.now().strftime('%H:%M:%S')}",
            "description": "Тестовый проект для проверки шаблона комплексного сбора данных",
            "data": complex_template['data']
        }
        
        create_response = requests.post('http://localhost:5000/api/projects', json=project_data)
        if create_response.status_code != 201:
            print(f"❌ Ошибка создания проекта: {create_response.status_code}")
            return
            
        project = create_response.json()
        project_id = project['id']
        print(f"✅ Создан тестовый проект с ID: {project_id}")
        
        # Анализируем структуру шаблона
        analyze_template_structure(complex_template['data'])
        
        # Экспортируем код бота
        export_response = requests.post(f'http://localhost:5000/api/projects/{project_id}/export')
        if export_response.status_code != 200:
            print(f"❌ Ошибка экспорта кода: {export_response.status_code}")
            return
            
        export_data = export_response.json()
        python_code = export_data['code']
        
        # Сохраняем сгенерированный код
        with open('complex_data_collection_bot.py', 'w', encoding='utf-8') as f:
            f.write(python_code)
            
        print(f"✅ Сгенерированный код сохранен в complex_data_collection_bot.py")
        
        # Анализируем сгенерированный код
        analyze_generated_code(python_code)
        
        # Тестируем создание экземпляра бота
        test_bot_instance_creation(project_id)
        
    except Exception as e:
        print(f"❌ Ошибка при тестировании: {e}")

def analyze_template_structure(data):
    """Анализирует структуру шаблона"""
    print("\n📊 АНАЛИЗ СТРУКТУРЫ ШАБЛОНА:")
    
    nodes = data.get('nodes', [])
    connections = data.get('connections', [])
    
    print(f"🔗 Узлы: {len(nodes)}")
    print(f"🔗 Соединения: {len(connections)}")
    
    # Анализируем типы узлов
    node_types = {}
    user_input_nodes = []
    
    for node in nodes:
        node_type = node.get('type', 'unknown')
        node_types[node_type] = node_types.get(node_type, 0) + 1
        
        if node_type == 'user-input':
            user_input_nodes.append(node)
    
    print("\n📋 Типы узлов:")
    for node_type, count in node_types.items():
        print(f"   {node_type}: {count}")
    
    # Анализируем узлы пользовательского ввода
    if user_input_nodes:
        print(f"\n📝 Узлы пользовательского ввода ({len(user_input_nodes)}):")
        for node in user_input_nodes:
            node_data = node.get('data', {})
            response_type = node_data.get('responseType', 'text')
            input_variable = node_data.get('inputVariable', 'unknown')
            is_required = node_data.get('isRequired', False)
            save_to_db = node_data.get('saveToDatabase', False)
            
            print(f"   🔹 {node['id']}: {response_type} → {input_variable} (обязательный: {is_required}, сохранить в БД: {save_to_db})")
            
            # Если это кнопочный ввод, показываем опции
            if response_type == 'buttons':
                options = node_data.get('responseOptions', [])
                print(f"      Опции: {len(options)}")
                for opt in options:
                    print(f"         • {opt.get('text', 'No text')} = {opt.get('value', 'No value')}")

def analyze_generated_code(code):
    """Анализирует сгенерированный код"""
    print("\n🔍 АНАЛИЗ СГЕНЕРИРОВАННОГО КОДА:")
    
    lines = code.split('\n')
    total_lines = len(lines)
    
    # Подсчитываем важные элементы
    imports = [line for line in lines if line.startswith('import') or line.startswith('from')]
    functions = [line for line in lines if line.strip().startswith('async def') or line.strip().startswith('def')]
    handlers = [line for line in lines if '@dp.' in line]
    
    print(f"📜 Общее количество строк: {total_lines}")
    print(f"📦 Импорты: {len(imports)}")
    print(f"🔧 Функции: {len(functions)}")
    print(f"🎯 Обработчики: {len(handlers)}")
    
    # Проверяем наличие ключевых элементов
    has_database_support = 'asyncpg' in code and 'bot_users' in code
    has_user_input_handling = 'user_input' in code or 'waiting_for_input' in code
    has_validation = 'validation' in code.lower()
    has_callback_handlers = '@dp.callback_query' in code
    
    print(f"\n✅ Ключевые возможности:")
    print(f"   📊 Поддержка БД: {has_database_support}")
    print(f"   📝 Обработка ввода: {has_user_input_handling}")
    print(f"   ✔️ Валидация: {has_validation}")
    print(f"   🔘 Callback кнопки: {has_callback_handlers}")
    
    # Проверяем наличие функций для работы с пользовательским вводом
    user_input_functions = [line.strip() for line in lines if 'user_input' in line.lower() and 'def' in line]
    if user_input_functions:
        print(f"\n📝 Функции пользовательского ввода:")
        for func in user_input_functions:
            print(f"   • {func}")

def test_bot_instance_creation(project_id):
    """Тестирует создание экземпляра бота"""
    print(f"\n🤖 ТЕСТ СОЗДАНИЯ ЭКЗЕМПЛЯРА БОТА:")
    
    # Это просто проверка API, не запускаем реальный бот
    try:
        # Получаем информацию о проекте
        project_response = requests.get(f'http://localhost:5000/api/projects/{project_id}')
        if project_response.status_code == 200:
            project = project_response.json()
            print(f"✅ Проект найден: {project['name']}")
            
            # Проверяем возможность получения пользователей (пустой список ожидается)
            users_response = requests.get(f'http://localhost:5000/api/projects/{project_id}/users')
            if users_response.status_code == 200:
                users = users_response.json()
                print(f"✅ API пользователей работает: {len(users)} пользователей")
            else:
                print(f"⚠️ Проблема с API пользователей: {users_response.status_code}")
            
            # Проверяем статистику
            stats_response = requests.get(f'http://localhost:5000/api/projects/{project_id}/users/stats')
            if stats_response.status_code == 200:
                stats = stats_response.json()
                print(f"✅ API статистики работает: {stats}")
            else:
                print(f"⚠️ Проблема с API статистики: {stats_response.status_code}")
        else:
            print(f"❌ Проект не найден: {project_response.status_code}")
            
    except Exception as e:
        print(f"❌ Ошибка при тестировании экземпляра: {e}")

def main():
    """Основная функция"""
    print("🚀 ТЕСТИРОВАНИЕ ШАБЛОНА 'КОМПЛЕКСНЫЙ СБОР ДАННЫХ'")
    print("=" * 60)
    
    test_complex_data_collection_template()
    
    print("\n" + "=" * 60)
    print("✅ ТЕСТИРОВАНИЕ ЗАВЕРШЕНО")
    print("\nПроверьте файл complex_data_collection_bot.py для анализа сгенерированного кода")

if __name__ == "__main__":
    main()