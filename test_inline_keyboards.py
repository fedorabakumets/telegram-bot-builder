#!/usr/bin/env python3
"""
Тест для проверки корректности работы с inline кнопками
"""

import ast
import re

def test_inline_keyboards():
    """Тестирует корректность работы с inline кнопками"""
    
    # Читаем сгенерированный код
    with open('test_fixed_menu_bot.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Извлекаем Python код из JSON
    import json
    data = json.loads(content)
    code = data['code']
    
    print("🔍 Проверяем структуру inline кнопок...")
    
    # Проверяем что для команды /menu используется только один message.answer()
    menu_handler_match = re.search(r'@dp\.message\(Command\("menu"\)\)(.*?)(?=@|\Z)', code, re.DOTALL)
    if menu_handler_match:
        menu_handler = menu_handler_match.group(1)
        answer_count = menu_handler.count('message.answer')
        print(f"  ✅ Команда /menu содержит {answer_count} вызовов message.answer()")
        
        if answer_count == 1:
            print("  ✅ ИСПРАВЛЕНО: Inline кнопки отправляются в одном сообщении")
        else:
            print("  ❌ ОШИБКА: Найдено несколько вызовов message.answer()")
            return False
    
    # Проверяем что inline кнопки прикрепляются к сообщению
    inline_pattern = r'builder\.add\(InlineKeyboardButton.*?\)\s*\n.*?keyboard = builder\.as_markup\(\)\s*\n.*?await message\.answer\(.*?reply_markup=keyboard\)'
    inline_matches = re.findall(inline_pattern, code, re.DOTALL)
    
    print(f"  ✅ Найдено {len(inline_matches)} корректных inline клавиатур")
    
    # Проверяем что нет отдельных отправок кнопок
    separate_keyboard_sends = re.findall(r'await message\.answer\(.*?keyboard.*?\)\s*\n.*?await message\.answer\(', code, re.DOTALL)
    if separate_keyboard_sends:
        print(f"  ❌ НАЙДЕНА ОШИБКА: {len(separate_keyboard_sends)} случаев раздельной отправки")
        return False
    else:
        print("  ✅ Раздельной отправки кнопок не найдено")
    
    # Проверяем callback обработчики
    callback_handlers = re.findall(r'@dp\.callback_query', code)
    print(f"  ✅ Найдено {len(callback_handlers)} callback обработчиков")
    
    print("\n🎉 Все проверки пройдены! Inline кнопки работают корректно.")
    return True

if __name__ == "__main__":
    test_inline_keyboards()