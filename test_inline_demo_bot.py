#!/usr/bin/env python3
"""
Демонстрационный бот для тестирования inline кнопок
"""

import json
import requests
import time

def create_test_bot_data():
    """Создает данные для тестового бота с inline кнопками"""
    bot_data = {
        "nodes": [
            {
                "id": "start-1",
                "type": "start",
                "data": {
                    "messageText": "🎉 Добро пожаловать в тестовый бот!\n\nЭтот бот демонстрирует работу inline кнопок.",
                    "keyboardType": "inline",
                    "command": "/start",
                    "showInMenu": True,
                    "description": "Запустить бота",
                    "buttons": [
                        {
                            "id": "btn-info",
                            "text": "📊 Информация",
                            "action": "goto",
                            "target": "info-node"
                        },
                        {
                            "id": "btn-help",
                            "text": "❓ Помощь",
                            "action": "goto", 
                            "target": "help-node"
                        },
                        {
                            "id": "btn-website",
                            "text": "🌐 Сайт",
                            "action": "url",
                            "url": "https://telegram.org"
                        }
                    ]
                }
            },
            {
                "id": "info-node",
                "type": "message",
                "data": {
                    "messageText": "📊 Информация о боте:\n\n• Создан для тестирования inline кнопок\n• Все callback_data корректны\n• Кнопки работают без ошибок",
                    "keyboardType": "inline",
                    "buttons": [
                        {
                            "id": "btn-back-info",
                            "text": "🔙 Назад",
                            "action": "goto",
                            "target": "start-1"
                        }
                    ]
                }
            },
            {
                "id": "help-node", 
                "type": "message",
                "data": {
                    "messageText": "❓ Справка:\n\n/start - Запуск бота\n\nВсе inline кнопки должны работать корректно!",
                    "keyboardType": "inline",
                    "buttons": [
                        {
                            "id": "btn-back-help",
                            "text": "🔙 На главную",
                            "action": "goto",
                            "target": "start-1"
                        }
                    ]
                }
            }
        ],
        "connections": []
    }
    return bot_data

def test_bot_creation_api():
    """Тестирует создание бота через API"""
    print("🤖 СОЗДАНИЕ ТЕСТОВОГО БОТА С INLINE КНОПКАМИ")
    print("=" * 50)
    
    # 1. Создаем данные бота
    bot_data = create_test_bot_data()
    print("1. ✅ Данные бота созданы")
    
    # 2. Создаем проект через API
    project_data = {
        "name": "Тест Inline Кнопок",
        "description": "Демонстрация исправленных inline кнопок",
        "data": bot_data
    }
    
    try:
        print("2. 🚀 Создаем проект через API...")
        response = requests.post('http://localhost:5000/api/projects', 
                               json=project_data, 
                               timeout=10)
        
        if response.status_code == 201:
            project = response.json()
            project_id = project['id']
            print(f"✅ Проект создан с ID: {project_id}")
            
            # 3. Генерируем код
            print("3. 🔧 Генерируем Python код...")
            export_response = requests.post(f'http://localhost:5000/api/projects/{project_id}/export',
                                          timeout=10)
            
            if export_response.status_code == 200:
                code_data = export_response.json()
                python_code = code_data['code']
                print("✅ Код сгенерирован успешно")
                
                # 4. Анализируем код
                print("4. 🔍 Анализируем сгенерированный код...")
                
                analysis = {
                    "inline_buttons": python_code.count('InlineKeyboardBuilder()'),
                    "callback_handlers": python_code.count('@dp.callback_query'),
                    "empty_callback_data": python_code.count('callback_data=""'),
                    "valid_callback_data": python_code.count('callback_data="start-1"') + 
                                         python_code.count('callback_data="info-node"') + 
                                         python_code.count('callback_data="help-node"'),
                    "syntax_check": None
                }
                
                # Проверяем синтаксис
                try:
                    compile(python_code, '<string>', 'exec')
                    analysis["syntax_check"] = True
                except SyntaxError:
                    analysis["syntax_check"] = False
                
                print("\n📊 РЕЗУЛЬТАТЫ АНАЛИЗА:")
                print("-" * 30)
                print(f"Inline кнопок создано: {analysis['inline_buttons']}")
                print(f"Callback обработчиков: {analysis['callback_handlers']}")
                print(f"Пустых callback_data: {analysis['empty_callback_data']}")
                print(f"Валидных callback_data: {analysis['valid_callback_data']}")
                print(f"Синтаксис корректен: {'✅' if analysis['syntax_check'] else '❌'}")
                
                # 5. Сохраняем код
                filename = f"demo_inline_bot_{project_id}.py"
                with open(filename, 'w', encoding='utf-8') as f:
                    f.write(python_code)
                print(f"\n💾 Код сохранен в файл: {filename}")
                
                # 6. Финальная оценка
                success = (analysis['empty_callback_data'] == 0 and 
                          analysis['valid_callback_data'] > 0 and
                          analysis['syntax_check'] == True and
                          analysis['callback_handlers'] > 0)
                
                print(f"\n🎯 ИТОГ: {'✅ УСПЕХ' if success else '❌ ТРЕБУЕТ ДОРАБОТКИ'}")
                
                if success:
                    print("\n🎉 INLINE КНОПКИ РАБОТАЮТ КОРРЕКТНО!")
                    print("• Нет пустых callback_data")
                    print("• Созданы обработчики callback_query")
                    print("• Код синтаксически корректен")
                    print("• Готово для запуска с токеном")
                
                return success, project_id
                
            else:
                print(f"❌ Ошибка генерации кода: {export_response.status_code}")
                return False, None
                
        else:
            print(f"❌ Ошибка создания проекта: {response.status_code}")
            return False, None
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return False, None

def main():
    """Основная функция демонстрации"""
    success, project_id = test_bot_creation_api()
    
    if success:
        print(f"\n🚀 СЛЕДУЮЩИЕ ШАГИ:")
        print("1. Откройте веб-интерфейс")
        print(f"2. Найдите проект 'Тест Inline Кнопок' (ID: {project_id})")
        print("3. Добавьте токен бота и запустите")
        print("4. Протестируйте inline кнопки в Telegram")
        print("\nВсе inline кнопки должны работать без ошибок!")
    else:
        print("\n❌ Тест не прошел. Требуется дополнительная диагностика.")

if __name__ == "__main__":
    main()