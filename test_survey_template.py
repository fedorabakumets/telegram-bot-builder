#!/usr/bin/env python3
"""
Тестирование шаблона опроса пользователей
"""
import requests
import json
import sys

def test_survey_template():
    """Тестирует шаблон опроса пользователей"""
    
    print("🔍 Тестирование шаблона 'Опрос пользователей'...")
    
    # Получаем шаблон из базы данных
    try:
        response = requests.get('http://localhost:5000/api/templates')
        if response.status_code == 200:
            templates = response.json()
            survey_template = None
            
            for template in templates:
                if template['name'] == 'Опрос пользователей':
                    survey_template = template
                    break
            
            if not survey_template:
                print("❌ Шаблон 'Опрос пользователей' не найден!")
                return False
            
            print(f"✅ Шаблон найден (ID: {survey_template['id']})")
            print(f"📝 Описание: {survey_template['description']}")
            print(f"🎯 Категория: {survey_template['category']}")
            print(f"🔧 Сложность: {survey_template['difficulty']}")
            
            # Проверяем структуру данных
            bot_data = survey_template['data']
            nodes = bot_data.get('nodes', [])
            connections = bot_data.get('connections', [])
            
            print(f"\n📊 Анализ структуры:")
            print(f"• Узлов: {len(nodes)}")
            print(f"• Связей: {len(connections)}")
            
            # Анализируем узлы
            node_types = {}
            for node in nodes:
                node_type = node.get('type', 'unknown')
                node_types[node_type] = node_types.get(node_type, 0) + 1
            
            print(f"\n📋 Типы узлов:")
            for node_type, count in node_types.items():
                print(f"• {node_type}: {count}")
            
            # Проверяем наличие узла user-input
            user_input_node = None
            for node in nodes:
                if node.get('type') == 'user-input':
                    user_input_node = node
                    break
            
            if user_input_node:
                print(f"\n✅ Узел сбора пользовательского ввода найден (ID: {user_input_node['id']})")
                input_data = user_input_node.get('data', {})
                print(f"• Тип ввода: {input_data.get('inputType', 'не указан')}")
                print(f"• Переменная: {input_data.get('inputVariable', 'не указана')}")
                print(f"• Сохранение в БД: {input_data.get('saveToDatabase', False)}")
                print(f"• Минимальная длина: {input_data.get('minLength', 0)}")
                print(f"• Максимальная длина: {input_data.get('maxLength', 0)}")
                print(f"• Таймаут: {input_data.get('inputTimeout', 0)} сек")
            else:
                print("❌ Узел сбора пользовательского ввода не найден!")
            
            # Создаем временный проект для тестирования генератора
            project_data = {
                "name": "Тестовый проект опроса",
                "description": "Тестирование генератора кода для опроса пользователей",
                "data": bot_data
            }
            
            print(f"\n🔧 Тестирование генератора кода...")
            
            # Создаем проект
            create_response = requests.post('http://localhost:5000/api/projects', json=project_data)
            if create_response.status_code == 201:
                project = create_response.json()
                project_id = project['id']
                print(f"✅ Тестовый проект создан (ID: {project_id})")
                
                # Генерируем код
                export_response = requests.post(f'http://localhost:5000/api/projects/{project_id}/export')
                if export_response.status_code == 200:
                    code_data = export_response.json()
                    python_code = code_data.get('code', '')
                    
                    print(f"✅ Код успешно сгенерирован ({len(python_code)} символов)")
                    
                    # Проверяем наличие ключевых элементов в коде
                    required_elements = [
                        'async def start_handler',
                        'async def handle_user_input',
                        'waiting_for_input',
                        'discovery_source',
                        'save_to_database',
                        'min_length',
                        'max_length',
                        'handle_callback_',
                        'InlineKeyboardMarkup',
                        'InlineKeyboardButton'
                    ]
                    
                    missing_elements = []
                    for element in required_elements:
                        if element not in python_code:
                            missing_elements.append(element)
                    
                    if missing_elements:
                        print(f"❌ Отсутствуют элементы в коде: {', '.join(missing_elements)}")
                    else:
                        print(f"✅ Все ключевые элементы присутствуют в коде")
                    
                    # Проверяем синтаксис Python
                    try:
                        compile(python_code, '<string>', 'exec')
                        print(f"✅ Код синтаксически корректен")
                    except SyntaxError as e:
                        print(f"❌ Синтаксическая ошибка в коде: {e}")
                    
                    # Сохраняем код для проверки
                    with open('generated_survey_bot.py', 'w', encoding='utf-8') as f:
                        f.write(python_code)
                    print(f"📁 Код сохранен в файл: generated_survey_bot.py")
                    
                    # Удаляем тестовый проект
                    requests.delete(f'http://localhost:5000/api/projects/{project_id}')
                    print(f"🗑️ Тестовый проект удален")
                    
                    return True
                else:
                    print(f"❌ Ошибка генерации кода: HTTP {export_response.status_code}")
                    return False
            else:
                print(f"❌ Ошибка создания проекта: HTTP {create_response.status_code}")
                return False
                
        else:
            print(f"❌ Ошибка получения шаблонов: HTTP {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Ошибка подключения к серверу")
        return False
    except Exception as e:
        print(f"❌ Неожиданная ошибка: {e}")
        return False

def analyze_generated_code():
    """Анализирует сгенерированный код"""
    
    print("\n🔍 Анализ сгенерированного кода...")
    
    try:
        with open('generated_survey_bot.py', 'r', encoding='utf-8') as f:
            code = f.read()
        
        # Подсчитываем различные элементы
        lines = code.split('\n')
        
        handlers = [line for line in lines if 'async def' in line and 'handler' in line]
        callbacks = [line for line in lines if 'handle_callback_' in line and 'async def' in line]
        user_input_handlers = [line for line in lines if 'handle_user_input' in line and 'async def' in line]
        
        print(f"📊 Статистика кода:")
        print(f"• Строк кода: {len(lines)}")
        print(f"• Обработчиков: {len(handlers)}")
        print(f"• Callback обработчиков: {len(callbacks)}")
        print(f"• Обработчиков пользовательского ввода: {len(user_input_handlers)}")
        
        print(f"\n📋 Найденные обработчики:")
        for handler in handlers:
            print(f"• {handler.strip()}")
        
        # Проверяем специфичные элементы для опроса
        if 'discovery_source' in code:
            print(f"✅ Переменная discovery_source найдена")
        if 'waiting_for_input' in code:
            print(f"✅ Система ожидания ввода найдена")
        if 'save_to_database' in code:
            print(f"✅ Сохранение в БД найдено")
        if 'min_length' in code and 'max_length' in code:
            print(f"✅ Валидация длины найдена")
        if 'handle_user_input' in code:
            print(f"✅ Универсальный обработчик ввода найден")
        if 'email_pattern' in code:
            print(f"✅ Валидация email найдена")
        if 'phone_pattern' in code:
            print(f"✅ Валидация телефона найдена")
        
        return True
        
    except FileNotFoundError:
        print("❌ Файл generated_survey_bot.py не найден")
        return False
    except Exception as e:
        print(f"❌ Ошибка анализа кода: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Запуск тестирования шаблона опроса...")
    
    success = test_survey_template()
    if success:
        analyze_generated_code()
        print("\n🎉 Тестирование завершено успешно!")
    else:
        print("\n❌ Тестирование завершилось с ошибками")
        sys.exit(1)