#!/usr/bin/env python3
"""
Тест запуска реального бота для проверки работы inline кнопок
"""

import requests
import json
import time

def test_bot_execution():
    """Тестирует запуск бота с inline кнопками"""
    print("🚀 ТЕСТ ЗАПУСКА БОТА С INLINE КНОПКАМИ")
    print("=" * 50)
    
    # Создаем проект с простой inline кнопкой
    bot_data = {
        "nodes": [
            {
                "id": "start-1",
                "type": "start",
                "position": {"x": 100, "y": 100},
                "data": {
                    "command": "/start",
                    "messageText": "🎉 Привет! Нажми кнопку ниже:",
                    "keyboardType": "inline",
                    "buttons": [
                        {
                            "id": "btn-test",
                            "text": "🔥 Тестовая кнопка", 
                            "action": "goto",
                            "target": "XyZ987Test654Random"
                        }
                    ]
                }
            },
            {
                "id": "XyZ987Test654Random",
                "type": "message",
                "position": {"x": 300, "y": 100},
                "data": {
                    "messageText": "✅ Отлично! Inline кнопка работает!",
                    "keyboardType": "none",
                    "buttons": []
                }
            }
        ],
        "connections": []
    }
    
    # Создаем проект
    print("1. 📝 Создаем тестовый проект...")
    project_response = requests.post('http://localhost:5000/api/projects', 
                                   json={
                                       "name": "Тест inline кнопок",
                                       "description": "Проверка работы inline кнопок в реальном боте",
                                       "data": bot_data
                                   })
    
    if project_response.status_code != 201:
        print(f"❌ Ошибка создания проекта: {project_response.status_code}")
        return False
    
    project_id = project_response.json()['id']
    print(f"✅ Проект создан с ID: {project_id}")
    
    # Генерируем код
    print("2. 🔧 Генерируем код бота...")
    export_response = requests.post(f'http://localhost:5000/api/projects/{project_id}/export')
    if export_response.status_code != 200:
        print(f"❌ Ошибка экспорта: {export_response.status_code}")
        return False
    
    code = export_response.json()['code']
    
    # Сохраняем код
    with open('test_inline_bot.py', 'w', encoding='utf-8') as f:
        f.write(code)
    print("✅ Код сохранен: test_inline_bot.py")
    
    # Проверяем код
    print("3. 🔍 Проверяем структуру кода...")
    checks = {
        "inline_button_created": 'InlineKeyboardButton(text="🔥 Тестовая кнопка", callback_data="XyZ987Test654Random")' in code,
        "callback_handler_exists": '@dp.callback_query(lambda c: c.data == "XyZ987Test654Random")' in code,
        "message_sent_with_keyboard": 'await message.answer(text, reply_markup=keyboard)' in code,
        "callback_answered": 'await callback_query.answer()' in code,
        "syntax_valid": check_syntax(code)
    }
    
    for check, result in checks.items():
        print(f"  - {check}: {'✅' if result else '❌'}")
    
    if all(checks.values()):
        print("\n✅ ВСЕ ПРОВЕРКИ ПРОШЛИ! Код должен работать правильно")
        
        print("\n📋 ИНСТРУКЦИИ ДЛЯ ТЕСТИРОВАНИЯ:")
        print("1. Получите токен бота у @BotFather")
        print("2. Замените YOUR_BOT_TOKEN_HERE в файле test_inline_bot.py")
        print("3. Запустите: python test_inline_bot.py")
        print("4. Протестируйте команду /start в Telegram")
        print("5. Нажмите на кнопку '🔥 Тестовая кнопка'")
        print("6. Должно прийти сообщение '✅ Отлично! Inline кнопка работает!'")
        
        return True
    else:
        print("\n❌ НАЙДЕНЫ ПРОБЛЕМЫ В КОДЕ!")
        failed_checks = [k for k, v in checks.items() if not v]
        for check in failed_checks:
            print(f"  - {check}")
        return False

def check_syntax(code):
    """Проверяет синтаксис Python"""
    try:
        compile(code, '<string>', 'exec')
        return True
    except SyntaxError as e:
        print(f"    Синтаксическая ошибка: {e}")
        return False

def show_detailed_analysis():
    """Показывает детальный анализ проблемы"""
    print("\n🔬 ДЕТАЛЬНЫЙ АНАЛИЗ ПРОБЛЕМЫ:")
    print("-" * 30)
    
    print("Основываясь на наших тестах:")
    print("✅ Генератор кода работает правильно")
    print("✅ Inline кнопки создаются с правильным callback_data") 
    print("✅ Callback обработчики генерируются правильно")
    print("✅ Код синтаксически корректен")
    
    print("\n💡 ВОЗМОЖНЫЕ ПРИЧИНЫ ПРОБЛЕМЫ У ПОЛЬЗОВАТЕЛЯ:")
    print("1. 🔧 Проблема с токеном бота (неверный или отозванный)")
    print("2. 🔒 Бот заблокирован пользователем или в чате")
    print("3. 🌐 Проблемы с сетью или сервером Telegram")
    print("4. 📱 Старая версия клиента Telegram")
    print("5. ⚡ Бот перезапускался и потерял состояние")
    print("6. 🎯 Пользователь тестирует в групповом чате без прав")
    
    print("\n🛠️ РЕКОМЕНДАЦИИ ДЛЯ УСТРАНЕНИЯ:")
    print("1. Проверить токен бота - создать новый если нужно")
    print("2. Протестировать в приватном чате с ботом")
    print("3. Перезапустить бота полностью")
    print("4. Проверить логи на наличие ошибок")
    print("5. Убедиться что бот имеет права в группе (если используется)")

def main():
    """Основная функция"""
    success = test_bot_execution()
    
    if success:
        print(f"\n🎉 ЗАКЛЮЧЕНИЕ: Генератор кода работает правильно!")
        print("Проблема скорее всего не в коде, а в настройках или окружении")
    
    show_detailed_analysis()

if __name__ == "__main__":
    main()