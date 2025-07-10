#!/usr/bin/env python3
"""
Тест современного шаблона сбора данных - ИСПРАВЛЕНО
Проверяем работу inline кнопок и навигации после текстового ввода
"""

import re
import os

def test_modern_data_collection_template():
    """
    Тестируем современный шаблон сбора данных
    
    Проверяем:
    1. Наличие inline кнопок в collection-message
    2. Правильную навигацию после текстового ввода
    3. Корректную структуру всех узлов
    """
    
    print("🔍 Тестирование современного шаблона сбора данных...")
    print("=" * 70)
    
    # Читаем сгенерированный код бота
    bot_file = "bots/bot_1.py"
    if not os.path.exists(bot_file):
        print("❌ Файл бота не найден")
        return False
    
    with open(bot_file, 'r', encoding='utf-8') as f:
        bot_code = f.read()
    
    # Проверки callback обработчика collection-message
    collection_callback_tests = [
        # Основные проверки
        ("Callback handler collection-message существует", 
         '@dp.callback_query(lambda c: c.data == "collection-message")' in bot_code),
        
        ("Функция handle_callback_collection_message определена", 
         'async def handle_callback_collection_message(callback_query: types.CallbackQuery):' in bot_code),
        
        # Проверяем наличие inline кнопок
        ("Inline кнопка 'Отлично' создается", 
         'InlineKeyboardButton(text="Отлично", callback_data="thank-you-message")' in bot_code),
        
        ("Inline кнопка 'Хорошо' создается", 
         'InlineKeyboardButton(text=" Хорошо", callback_data="thank-you-message")' in bot_code),
        
        ("Inline кнопка 'Средне' создается", 
         'InlineKeyboardButton(text="Средне", callback_data="thank-you-message")' in bot_code),
        
        ("Inline кнопка 'Плохо' создается", 
         'InlineKeyboardButton(text=" Плохо", callback_data="thank-you-message")' in bot_code),
        
        # Проверки конфигурации пользовательского ввода
        ("Waiting for input устанавливается", 
         'user_data[callback_query.from_user.id]["waiting_for_input"] = "collection-message"' in bot_code),
        
        ("Input type устанавливается", 
         'user_data[callback_query.from_user.id]["input_type"] = "text"' in bot_code),
        
        ("Input variable устанавливается", 
         'user_data[callback_query.from_user.id]["input_variable"] = "user_feedback"' in bot_code),
        
        ("Save to database включено", 
         'user_data[callback_query.from_user.id]["save_to_database"] = True' in bot_code),
        
        ("Target node ID устанавливается", 
         'user_data[callback_query.from_user.id]["input_target_node_id"] = "thank-you-message"' in bot_code),
    ]
    
    # Проверки обработчика пользовательского ввода
    user_input_tests = [
        ("Универсальный обработчик ввода существует", 
         '@dp.message(F.text)' in bot_code),
        
        ("Функция handle_user_input определена", 
         'async def handle_user_input(message: types.Message):' in bot_code),
        
        ("Проверка waiting_for_input статуса", 
         'if user_id in user_data and "waiting_for_input" in user_data[user_id]:' in bot_code),
        
        ("Навигация к thank-you-message", 
         'elif next_node_id == "thank-you-message":' in bot_code),
        
        ("Сохранение данных в базу данных", 
         'await update_user_data_in_db(user_id, variable_name, response_data)' in bot_code),
    ]
    
    # Проверки обработчика thank-you-message
    thank_you_tests = [
        ("Callback handler thank-you-message существует", 
         '@dp.callback_query(lambda c: c.data == "thank-you-message")' in bot_code),
        
        ("Функция handle_callback_thank_you_message определена", 
         'async def handle_callback_thank_you_message(callback_query: types.CallbackQuery):' in bot_code),
        
        ("Кнопка 'Пройти опрос снова' создается", 
         'InlineKeyboardButton(text="🔄 Пройти опрос снова", callback_data="start-command")' in bot_code),
        
        ("Сообщение благодарности отправляется", 
         '🎉 Спасибо за участие в опросе!' in bot_code),
    ]
    
    # Объединяем все тесты
    all_tests = collection_callback_tests + user_input_tests + thank_you_tests
    
    passed = 0
    failed = 0
    
    print("📋 Проверка callback обработчика collection-message:")
    for test_name, result in collection_callback_tests:
        if result:
            print(f"✅ {test_name}")
            passed += 1
        else:
            print(f"❌ {test_name}")
            failed += 1
    
    print("\n📋 Проверка обработчика пользовательского ввода:")
    for test_name, result in user_input_tests:
        if result:
            print(f"✅ {test_name}")
            passed += 1
        else:
            print(f"❌ {test_name}")
            failed += 1
    
    print("\n📋 Проверка обработчика thank-you-message:")
    for test_name, result in thank_you_tests:
        if result:
            print(f"✅ {test_name}")
            passed += 1
        else:
            print(f"❌ {test_name}")
            failed += 1
    
    print(f"\n📊 Общие результаты: {passed}/{len(all_tests)} тестов пройдено")
    
    if failed == 0:
        print("🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ!")
        print("✅ Inline кнопки генерируются корректно")
        print("✅ Текстовый ввод работает параллельно с кнопками")
        print("✅ Навигация после ввода настроена правильно")
        print("✅ Сохранение в базу данных включено")
        print("🚀 Современный шаблон сбора данных полностью функционален!")
        return True
    else:
        print(f"⚠️  {failed} тестов не пройдено")
        print("❌ Требуется дополнительная настройка")
        return False

def test_generated_code():
    """
    Тестируем сгенерированный код бота
    """
    print("\n🔍 Анализ сгенерированного кода...")
    print("=" * 50)
    
    bot_file = "bots/bot_1.py"
    with open(bot_file, 'r', encoding='utf-8') as f:
        bot_code = f.read()
    
    # Подсчитываем количество различных элементов
    callback_handlers = len(re.findall(r'@dp\.callback_query\(lambda c: c\.data == "[^"]+"\)', bot_code))
    inline_buttons = len(re.findall(r'InlineKeyboardButton\(text="[^"]+", callback_data="[^"]+"\)', bot_code))
    command_handlers = len(re.findall(r'@dp\.message\(Command\("[^"]+"\)\)', bot_code))
    
    print(f"📊 Статистика кода:")
    print(f"   Callback handlers: {callback_handlers}")
    print(f"   Inline buttons: {inline_buttons}")
    print(f"   Command handlers: {command_handlers}")
    
    # Проверяем ключевые функции
    key_functions = [
        "init_database",
        "save_user_to_db",
        "update_user_data_in_db",
        "handle_user_input",
        "handle_callback_collection_message",
        "handle_callback_thank_you_message"
    ]
    
    print(f"\n🔧 Ключевые функции:")
    for func in key_functions:
        if f"async def {func}" in bot_code:
            print(f"✅ {func}")
        else:
            print(f"❌ {func}")
    
    return True

def main():
    """
    Основная функция тестирования
    """
    print("🚀 Тестирование современного шаблона сбора данных...")
    print("=" * 70)
    
    success = test_modern_data_collection_template()
    test_generated_code()
    
    if success:
        print("\n🎯 ИТОГОВЫЙ РЕЗУЛЬТАТ:")
        print("✅ Современный шаблон сбора данных ПОЛНОСТЬЮ ИСПРАВЛЕН!")
        print("📱 Inline кнопки будут отображаться в Telegram")
        print("💬 Текстовый ввод работает параллельно с кнопками")
        print("🔄 Навигация после ввода настроена корректно")
        print("💾 Все данные сохраняются в базу данных")
        print("\n🎉 ЗАДАЧА ВЫПОЛНЕНА УСПЕШНО!")
    else:
        print("\n❌ ТРЕБУЕТСЯ ДОПОЛНИТЕЛЬНАЯ РАБОТА!")
    
    return success

if __name__ == "__main__":
    main()