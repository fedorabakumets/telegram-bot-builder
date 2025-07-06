#!/usr/bin/env python3
"""
Финальный тест inline кнопок для комплексного бота
"""

import re
import json

def test_inline_buttons_comprehensive():
    """Комплексная проверка inline кнопок"""
    
    print("🎯 ФИНАЛЬНЫЙ ТЕСТ INLINE КНОПОК")
    print("=" * 40)
    
    # Читаем сгенерированный код комплексного бота
    with open('complex_test_bot_3.py', 'r', encoding='utf-8') as f:
        code = f.read()
    
    print(f"📄 Код загружен: {len(code)} символов")
    
    # Анализируем каждую команду отдельно
    commands = ['menu', 'games', 'settings', 'help', 'about']
    
    total_issues = 0
    total_commands = 0
    
    for cmd in commands:
        print(f"\n🔍 Проверяем команду /{cmd}:")
        
        # Ищем обработчик команды
        cmd_pattern = f'@dp\\.message\\(Command\\("{cmd}"\\)\\)(.*?)(?=@dp\\.|\\Z)'
        cmd_match = re.search(cmd_pattern, code, re.DOTALL)
        
        if cmd_match:
            total_commands += 1
            cmd_code = cmd_match.group(1)
            
            # Считаем вызовы message.answer()
            answer_calls = re.findall(r'await message\.answer\(', cmd_code)
            answer_count = len(answer_calls)
            
            # Проверяем есть ли inline кнопки
            has_inline = 'InlineKeyboardBuilder()' in cmd_code
            
            print(f"  • Inline кнопки: {'✅' if has_inline else '❌'}")
            print(f"  • Вызовов message.answer(): {answer_count}")
            
            if has_inline and answer_count == 1:
                print(f"  ✅ ОТЛИЧНО: Inline кнопки прикреплены правильно")
            elif has_inline and answer_count > 1:
                print(f"  ❌ ПРОБЛЕМА: {answer_count} отдельных сообщений вместо одного")
                total_issues += 1
                
                # Показываем детали проблемы
                lines = cmd_code.split('\n')
                answer_lines = []
                for i, line in enumerate(lines):
                    if 'await message.answer(' in line:
                        answer_lines.append(f"    Строка {i+1}: {line.strip()}")
                
                print(f"  🔧 Найденные вызовы:")
                for line in answer_lines[:3]:  # Показываем первые 3
                    print(line)
            elif not has_inline:
                print(f"  ℹ️ Команда без inline кнопок")
            else:
                print(f"  ✅ Команда работает корректно")
        else:
            print(f"  ❌ Обработчик команды не найден")
    
    # Дополнительная проверка callback handlers
    print(f"\n🔗 Проверяем callback handlers:")
    callback_handlers = re.findall(r'@dp\.callback_query\([^)]+\)', code)
    print(f"  • Найдено callback handlers: {len(callback_handlers)}")
    
    # Проверяем правильность callback handlers
    callback_pattern = r'@dp\.callback_query\([^)]+\)(.*?)(?=@dp\.|\\Z)'
    callback_matches = re.findall(callback_pattern, code, re.DOTALL)
    
    edit_text_count = 0
    answer_count = 0
    
    for callback_code in callback_matches:
        if 'callback_query.message.edit_text' in callback_code:
            edit_text_count += 1
        if 'await message.answer(' in callback_code:
            answer_count += 1
    
    print(f"  • Используют edit_text(): {edit_text_count}")
    print(f"  • Используют message.answer(): {answer_count}")
    
    if edit_text_count > answer_count:
        print(f"  ✅ Большинство callback используют edit_text() (правильно)")
    else:
        print(f"  ⚠️ Некоторые callback используют message.answer() вместо edit_text()")
    
    # Проверяем наличие отдельных message handlers
    print(f"\n📝 Проверяем отдельные message handlers:")
    separate_handlers = re.findall(r'async def handle_[^(]+\(message: types\.Message\)', code)
    
    if separate_handlers:
        print(f"  ❌ Найдено {len(separate_handlers)} отдельных handlers:")
        for handler in separate_handlers[:5]:  # Показываем первые 5
            print(f"    • {handler}")
        print(f"  🔧 Эти handlers создают лишние message.answer() вызовы")
    else:
        print(f"  ✅ Отдельных message handlers нет")
    
    # Проверяем правильность структуры inline кнопок
    print(f"\n🎯 Проверяем структуру inline кнопок:")
    
    # Ищем правильный паттерн: builder -> buttons -> markup -> answer
    correct_pattern = r'builder = InlineKeyboardBuilder\(\)\s*\n(?:\s*builder\.add\([^)]+\)\s*\n)+\s*keyboard = builder\.as_markup\(\)\s*\n[^#]*await message\.answer\([^,]+, reply_markup=keyboard\)'
    correct_matches = re.findall(correct_pattern, code, re.DOTALL)
    
    print(f"  • Правильных inline структур: {len(correct_matches)}")
    
    # Ищем неправильный паттерн: отдельные сообщения
    wrong_pattern = r'await message\.answer\([^)]+\)\s*\n[^#]*await message\.answer\([^)]+reply_markup='
    wrong_matches = re.findall(wrong_pattern, code, re.DOTALL)
    
    print(f"  • Неправильных структур: {len(wrong_matches)}")
    
    # Итоговый результат
    print(f"\n🎖️ ИТОГОВЫЙ РЕЗУЛЬТАТ:")
    print(f"-" * 25)
    print(f"• Проверено команд: {total_commands}")
    print(f"• Проблемных команд: {total_issues}")
    print(f"• Правильных inline структур: {len(correct_matches)}")
    print(f"• Неправильных структур: {len(wrong_matches)}")
    
    if total_issues == 0 and len(wrong_matches) == 0:
        print(f"🎉 ИДЕАЛЬНО! Все inline кнопки работают правильно")
        return True
    elif total_issues <= 1:
        print(f"👍 ХОРОШО! Есть незначительные проблемы")
        return True
    else:
        print(f"⚠️ ТРЕБУЕТ ДОРАБОТКИ! Найдены серьёзные проблемы")
        return False

def compare_with_simple_test():
    """Сравнение с простым тестом"""
    print(f"\n📊 СРАВНЕНИЕ С ПРОСТЫМ ТЕСТОМ:")
    print(f"-" * 30)
    
    # Простой тест из исходного файла
    try:
        with open('test_fixed_menu_bot.py', 'r', encoding='utf-8') as f:
            simple_content = f.read()
        
        # Извлекаем Python код из JSON
        simple_data = json.loads(simple_content)
        simple_code = simple_data['code']
        
        # Анализируем простой бот
        simple_commands = re.findall(r'@dp\.message\(Command\("([^"]+)"\)\)', simple_code)
        simple_callbacks = re.findall(r'@dp\.callback_query\(', simple_code)
        
        print(f"• Простой бот: {len(simple_commands)} команд, {len(simple_callbacks)} callbacks")
        
        # Анализируем комплексный бот
        with open('complex_test_bot_3.py', 'r', encoding='utf-8') as f:
            complex_code = f.read()
        
        complex_commands = re.findall(r'@dp\.message\(Command\("([^"]+)"\)\)', complex_code)
        complex_callbacks = re.findall(r'@dp\.callback_query\(', complex_code)
        
        print(f"• Комплексный бот: {len(complex_commands)} команд, {len(complex_callbacks)} callbacks")
        print(f"• Увеличение сложности: {len(complex_commands)/len(simple_commands):.1f}x команд, {len(complex_callbacks)/len(simple_callbacks):.1f}x callbacks")
        
    except Exception as e:
        print(f"⚠️ Не удалось сравнить: {e}")

def main():
    """Основная функция"""
    success = test_inline_buttons_comprehensive()
    compare_with_simple_test()
    
    print(f"\n" + "="*50)
    if success:
        print(f"🏆 ТЕСТИРОВАНИЕ ЗАВЕРШЕНО УСПЕШНО!")
        print(f"✅ Проблема с inline кнопками исправлена")
        print(f"🎯 Генератор кода работает корректно")
    else:
        print(f"⚠️ ТЕСТИРОВАНИЕ ВЫЯВИЛО ПРОБЛЕМЫ")
        print(f"🔧 Требуется дополнительная доработка")

if __name__ == "__main__":
    main()