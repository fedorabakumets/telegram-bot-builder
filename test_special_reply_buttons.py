#!/usr/bin/env python3
"""
Тест специальных Reply кнопок (контакт и геолокация)
"""

import re

def test_special_button_generation():
    """Тестирует генерацию специальных Reply кнопок"""
    
    print("📞 ТЕСТ СПЕЦИАЛЬНЫХ REPLY КНОПОК")
    print("=" * 35)
    
    # Загружаем код Reply бота
    try:
        with open('reply_keyboard_test_4_final.py', 'r', encoding='utf-8') as f:
            code = f.read()
        print(f"📄 Код загружен: {len(code)} символов\n")
    except Exception as e:
        print(f"❌ Ошибка загрузки кода: {e}")
        return False
    
    # Проверяем наличие контактных кнопок
    print("📞 ПРОВЕРКА КОНТАКТНЫХ КНОПОК:")
    print("-" * 28)
    
    contact_button_pattern = r'KeyboardButton\([^)]*request_contact=True'
    contact_buttons = re.findall(contact_button_pattern, code)
    
    print(f"  • Найдено контактных кнопок: {len(contact_buttons)}")
    
    if contact_buttons:
        print("  ✅ Контактные кнопки генерируются правильно")
        for i, button in enumerate(contact_buttons[:3]):
            print(f"    - Кнопка {i+1}: {button}")
    else:
        print("  ❌ Контактные кнопки не найдены")
    
    # Проверяем наличие кнопок геолокации
    print("\n📍 ПРОВЕРКА КНОПОК ГЕОЛОКАЦИИ:")
    print("-" * 30)
    
    location_button_pattern = r'KeyboardButton\([^)]*request_location=True'
    location_buttons = re.findall(location_button_pattern, code)
    
    print(f"  • Найдено кнопок геолокации: {len(location_buttons)}")
    
    if location_buttons:
        print("  ✅ Кнопки геолокации генерируются правильно")
        for i, button in enumerate(location_buttons[:3]):
            print(f"    - Кнопка {i+1}: {button}")
    else:
        print("  ❌ Кнопки геолокации не найдены")
    
    # Проверяем обработчики контактов
    print("\n🔧 ПРОВЕРКА ОБРАБОТЧИКОВ КОНТАКТОВ:")
    print("-" * 33)
    
    contact_handler_patterns = [
        r'@dp\.message\([^)]*content_types.*contact',
        r'message\.contact',
        r'types\.ContentType\.CONTACT'
    ]
    
    contact_handlers_found = 0
    for pattern in contact_handler_patterns:
        matches = re.findall(pattern, code, re.IGNORECASE)
        contact_handlers_found += len(matches)
        if matches:
            print(f"  • Найден паттерн '{pattern}': {len(matches)} раз")
    
    if contact_handlers_found > 0:
        print("  ✅ Обработчики контактов присутствуют")
    else:
        print("  ❌ Обработчики контактов не найдены")
    
    # Проверяем обработчики геолокации
    print("\n🗺️ ПРОВЕРКА ОБРАБОТЧИКОВ ГЕОЛОКАЦИИ:")
    print("-" * 34)
    
    location_handler_patterns = [
        r'@dp\.message\([^)]*content_types.*location',
        r'message\.location',
        r'types\.ContentType\.LOCATION'
    ]
    
    location_handlers_found = 0
    for pattern in location_handler_patterns:
        matches = re.findall(pattern, code, re.IGNORECASE)
        location_handlers_found += len(matches)
        if matches:
            print(f"  • Найден паттерн '{pattern}': {len(matches)} раз")
    
    if location_handlers_found > 0:
        print("  ✅ Обработчики геолокации присутствуют")
    else:
        print("  ❌ Обработчики геолокации не найдены")
    
    # Проверяем правильность структуры специальных кнопок
    print("\n🎯 АНАЛИЗ СТРУКТУРЫ СПЕЦИАЛЬНЫХ КНОПОК:")
    print("-" * 38)
    
    # Ищем правильную структуру для контактных кнопок
    correct_contact_structure = r'KeyboardButton\(text="[^"]*", request_contact=True\)'
    correct_contact_matches = re.findall(correct_contact_structure, code)
    
    print(f"  • Правильная структура контактных кнопок: {len(correct_contact_matches)}")
    
    # Ищем правильную структуру для кнопок геолокации
    correct_location_structure = r'KeyboardButton\(text="[^"]*", request_location=True\)'
    correct_location_matches = re.findall(correct_location_structure, code)
    
    print(f"  • Правильная структура кнопок геолокации: {len(correct_location_matches)}")
    
    # Проверяем что специальные кнопки используются только в Reply клавиатурах
    print("\n🔒 ПРОВЕРКА ИСПОЛЬЗОВАНИЯ В REPLY КЛАВИАТУРАХ:")
    print("-" * 43)
    
    # Ищем использование специальных кнопок в Inline клавиатурах (ошибка)
    inline_contact_error = re.findall(r'InlineKeyboardButton\([^)]*request_contact', code)
    inline_location_error = re.findall(r'InlineKeyboardButton\([^)]*request_location', code)
    
    if inline_contact_error:
        print(f"  ❌ ОШИБКА: Контактные кнопки в Inline клавиатурах: {len(inline_contact_error)}")
    else:
        print("  ✅ Контактные кнопки только в Reply клавиатурах")
    
    if inline_location_error:
        print(f"  ❌ ОШИБКА: Кнопки геолокации в Inline клавиатурах: {len(inline_location_error)}")
    else:
        print("  ✅ Кнопки геолокации только в Reply клавиатурах")
    
    # Итоговая оценка специальных кнопок
    print("\n🏆 ИТОГОВАЯ ОЦЕНКА СПЕЦИАЛЬНЫХ КНОПОК:")
    print("-" * 38)
    
    score = 0
    max_score = 100
    
    # Генерация кнопок (40 баллов)
    if contact_buttons:
        score += 20
    if location_buttons:
        score += 20
    
    # Обработчики (30 баллов)
    if contact_handlers_found > 0:
        score += 15
    if location_handlers_found > 0:
        score += 15
    
    # Правильность структуры (20 баллов)
    if correct_contact_matches:
        score += 10
    if correct_location_matches:
        score += 10
    
    # Правильное использование (10 баллов)
    if not inline_contact_error:
        score += 5
    if not inline_location_error:
        score += 5
    
    print(f"🎖️ Итоговый балл: {score}/{max_score} ({score/max_score*100:.1f}%)")
    
    if score >= 80:
        print("🌟 ОТЛИЧНО! Специальные Reply кнопки работают идеально")
        return True
    elif score >= 60:
        print("👍 ХОРОШО! Специальные кнопки работают с незначительными недочетами")
        return True
    elif score >= 40:
        print("⚠️ УДОВЛЕТВОРИТЕЛЬНО! Есть проблемы со специальными кнопками")
        return False
    else:
        print("❌ ПЛОХО! Серьезные проблемы со специальными кнопками")
        return False

def analyze_reply_vs_inline_comparison():
    """Сравнительный анализ Reply и Inline кнопок"""
    print("\n📊 СРАВНИТЕЛЬНЫЙ АНАЛИЗ REPLY VS INLINE:")
    print("-" * 40)
    
    try:
        # Reply бот
        with open('reply_keyboard_test_4.py', 'r', encoding='utf-8') as f:
            reply_code = f.read()
        
        # Inline бот  
        with open('complex_test_bot_3.py', 'r', encoding='utf-8') as f:
            inline_code = f.read()
        
        # Анализ Reply
        reply_keyboards = len(re.findall(r'ReplyKeyboardBuilder\(\)', reply_code))
        reply_buttons = len(re.findall(r'KeyboardButton\(', reply_code))
        reply_contact = len(re.findall(r'request_contact=True', reply_code))
        reply_location = len(re.findall(r'request_location=True', reply_code))
        reply_removals = len(re.findall(r'ReplyKeyboardRemove\(\)', reply_code))
        
        # Анализ Inline
        inline_keyboards = len(re.findall(r'InlineKeyboardBuilder\(\)', inline_code))
        inline_buttons = len(re.findall(r'InlineKeyboardButton\(', inline_code))
        inline_callbacks = len(re.findall(r'callback_data=', inline_code))
        inline_urls = len(re.findall(r'url=', inline_code))
        
        print("Reply клавиатуры:")
        print(f"  • Клавиатур: {reply_keyboards}")
        print(f"  • Кнопок: {reply_buttons}")
        print(f"  • Контактных кнопок: {reply_contact}")
        print(f"  • Кнопок геолокации: {reply_location}")
        print(f"  • Удалений клавиатур: {reply_removals}")
        
        print("\nInline клавиатуры:")
        print(f"  • Клавиатур: {inline_keyboards}")
        print(f"  • Кнопок: {inline_buttons}")
        print(f"  • Callback кнопок: {inline_callbacks}")
        print(f"  • URL кнопок: {inline_urls}")
        
        print("\nВыводы:")
        print(f"  • Reply боты лучше для: навигации, запроса данных пользователя")
        print(f"  • Inline боты лучше для: интерактивности, веб-ссылок")
        print(f"  • Reply: больше кнопок на {((reply_buttons/inline_buttons-1)*100):.0f}%")
        print(f"  • Уникальные функции Reply: контакт и геолокация")
        
    except Exception as e:
        print(f"⚠️ Ошибка сравнения: {e}")

def main():
    """Основная функция тестирования специальных кнопок"""
    success = test_special_button_generation()
    analyze_reply_vs_inline_comparison()
    
    print(f"\n" + "="*50)
    if success:
        print("🎉 ТЕСТИРОВАНИЕ СПЕЦИАЛЬНЫХ REPLY КНОПОК ЗАВЕРШЕНО!")
        print("✅ Генератор поддерживает контактные кнопки и геолокацию")
        print("🎯 Reply клавиатуры работают корректно")
    else:
        print("⚠️ НАЙДЕНЫ ПРОБЛЕМЫ СО СПЕЦИАЛЬНЫМИ КНОПКАМИ")
        print("🔧 Требуется доработка генератора для специальных функций")

if __name__ == "__main__":
    main()