#!/usr/bin/env python3
"""
ТЕСТ: Проверка работы inline кнопок после исправления генератора
"""

import json
import sys
import os

# Добавляем путь к проекту
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from client.src.lib.bot_generator import generatePythonCode

def test_inline_buttons_generation():
    """Тестируем генерацию inline кнопок для узла с collectUserInput: true"""
    
    # Данные бота из реального проекта
    bot_data = {
        "nodes": [
            {
                "id": "vCq3Cu5FNmbKYbMfwwg75",
                "type": "start",
                "data": {
                    "messageText": "Добро пожаловать! Это ваш первый бот.",
                    "keyboardType": "inline",
                    "buttons": [
                        {
                            "id": "btn_start_1",
                            "text": "Продолжить",
                            "action": "goto",
                            "target": "N1q3_DYFHOucSIyw58fdu"
                        }
                    ]
                }
            },
            {
                "id": "N1q3_DYFHOucSIyw58fdu", # Проблемный узел
                "type": "message", 
                "data": {
                    "messageText": "Хочешься присоединиться к чату?",
                    "keyboardType": "inline",
                    "buttons": [
                        {
                            "id": "btn_yes",
                            "text": "ДА", 
                            "action": "goto",
                            "target": "1fJCssfE7JH8ASXBpgeUh"
                        },
                        {
                            "id": "btn_no",
                            "text": "НЕТ",
                            "action": "goto", 
                            "target": "u5L4a6DvDiwKBF6st7MJ8"
                        }
                    ],
                    "collectUserInput": True,  # ВОТ ГДЕ БЫЛА ПРОБЛЕМА!
                    "inputType": "text",
                    "saveToDatabase": True
                }
            },
            {
                "id": "1fJCssfE7JH8ASXBpgeUh",
                "type": "message",
                "data": {
                    "messageText": "Какой у тебя пол?",
                    "keyboardType": "inline",
                    "buttons": [
                        {
                            "id": "btn_male",
                            "text": "Мужчина",
                            "action": "goto",
                            "target": "end"
                        },
                        {
                            "id": "btn_female", 
                            "text": "Женщина",
                            "action": "goto",
                            "target": "end"
                        }
                    ]
                }
            },
            {
                "id": "u5L4a6DvDiwKBF6st7MJ8",
                "type": "message",
                "data": {
                    "messageText": "Очень жаль, но если надумаешь пиши старт или нажми на кнопку"
                }
            }
        ],
        "connections": [
            {"source": "vCq3Cu5FNmbKYbMfwwg75", "target": "N1q3_DYFHOucSIyw58fdu"},
            {"source": "N1q3_DYFHOucSIyw58fdu", "target": "1fJCssfE7JH8ASXBpgeUh"},
            {"source": "N1q3_DYFHOucSIyw58fdu", "target": "u5L4a6DvDiwKBF6st7MJ8"}
        ]
    }
    
    # Генерируем код
    generated_code = generatePythonCode(bot_data, "TestInlineButtonsFixedBot")
    
    print("=" * 60)
    print("ТЕСТ: Проверка исправления inline кнопок")
    print("=" * 60)
    
    # Проверки
    tests_passed = 0
    total_tests = 0
    
    # Тест 1: Callback обработчик для N1q3_DYFHOucSIyw58fdu должен существовать
    total_tests += 1
    if "handle_callback_N1q3_DYFHOucSIyw58fdu" in generated_code:
        print("✅ Тест 1 ПРОЙДЕН: Callback обработчик создан")
        tests_passed += 1
    else:
        print("❌ Тест 1 ПРОВАЛЕН: Callback обработчик НЕ создан")
    
    # Тест 2: В callback обработчике должны быть inline кнопки
    total_tests += 1
    if 'InlineKeyboardButton(text="ДА"' in generated_code and 'InlineKeyboardButton(text="НЕТ"' in generated_code:
        print("✅ Тест 2 ПРОЙДЕН: Inline кнопки генерируются")
        tests_passed += 1
    else:
        print("❌ Тест 2 ПРОВАЛЕН: Inline кнопки НЕ генерируются")
    
    # Тест 3: Callback обработчик должен настраивать сбор ввода
    total_tests += 1
    if 'user_data[callback_query.from_user.id]["waiting_for_input"]' in generated_code:
        print("✅ Тест 3 ПРОЙДЕН: Сбор пользовательского ввода настраивается")  
        tests_passed += 1
    else:
        print("❌ Тест 3 ПРОВАЛЕН: Сбор пользовательского ввода НЕ настраивается")
    
    # Тест 4: Должен использоваться edit_text с reply_markup
    total_tests += 1
    if "edit_text(text, reply_markup=keyboard" in generated_code:
        print("✅ Тест 4 ПРОЙДЕН: Inline кнопки прикрепляются к сообщению")
        tests_passed += 1
    else:
        print("❌ Тест 4 ПРОВАЛЕН: Inline кнопки НЕ прикрепляются к сообщению")
    
    # Тест 5: Должны быть правильные callback_data
    total_tests += 1
    if 'callback_data="1fJCssfE7JH8ASXBpgeUh"' in generated_code and 'callback_data="u5L4a6DvDiwKBF6st7MJ8"' in generated_code:
        print("✅ Тест 5 ПРОЙДЕН: Правильные callback_data для кнопок")
        tests_passed += 1
    else:
        print("❌ Тест 5 ПРОВАЛЕН: Неправильные callback_data для кнопок")
        
    print("=" * 60)
    print(f"РЕЗУЛЬТАТ: {tests_passed}/{total_tests} тестов пройдено")
    
    if tests_passed == total_tests:
        print("🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ! Исправление работает правильно!")
        return True
    else:
        print("⚠️ Есть проблемы, требующие внимания")
        return False

if __name__ == "__main__":
    success = test_inline_buttons_generation()
    
    if not success:
        print("\n" + "="*60)
        print("ДЕТАЛЬНЫЙ АНАЛИЗ ПРОБЛЕМЫ:")
        print("="*60)
        print("1. Узел N1q3_DYFHOucSIyw58fdu имеет collectUserInput: true")
        print("2. Раньше это блокировало генерацию inline кнопок в callback обработчиках")
        print("3. Исправление должно добавить поддержку inline кнопок даже при collectUserInput: true")
        print("4. Callback обработчик должен создавать кнопки И настраивать сбор ввода одновременно")
    
    sys.exit(0 if success else 1)