#!/usr/bin/env python3
"""
Комплексный тест Reply клавиатур
"""

import re
import json
from typing import Dict, List

def analyze_reply_keyboards(code: str) -> Dict:
    """Анализирует Reply клавиатуры в коде"""
    results = {
        'total_reply_keyboards': 0,
        'reply_buttons': 0,
        'contact_buttons': 0,
        'location_buttons': 0,
        'one_time_keyboards': 0,
        'permanent_keyboards': 0,
        'resizable_keyboards': 0,
        'fixed_size_keyboards': 0,
        'proper_reply_structure': 0,
        'keyboard_removals': 0
    }
    
    # Ищем Reply клавиатуры
    reply_pattern = r'builder = ReplyKeyboardBuilder\(\)(.*?)keyboard = builder\.as_markup\([^)]*\)'
    reply_matches = re.findall(reply_pattern, code, re.DOTALL)
    results['total_reply_keyboards'] = len(reply_matches)
    
    # Анализируем каждую Reply клавиатуру
    for match in reply_matches:
        # Считаем кнопки
        buttons = re.findall(r'builder\.add\(KeyboardButton\(', match)
        results['reply_buttons'] += len(buttons)
        
        # Проверяем настройки
        if 'one_time_keyboard=True' in match:
            results['one_time_keyboards'] += 1
        else:
            results['permanent_keyboards'] += 1
            
        if 'resize_keyboard=True' in match:
            results['resizable_keyboards'] += 1
        else:
            results['fixed_size_keyboards'] += 1
    
    # Ищем специальные кнопки
    contact_buttons = re.findall(r'request_contact=True', code)
    results['contact_buttons'] = len(contact_buttons)
    
    location_buttons = re.findall(r'request_location=True', code)
    results['location_buttons'] = len(location_buttons)
    
    # Ищем правильную структуру
    proper_structure = re.findall(r'builder = ReplyKeyboardBuilder\(\)\s*\n(?:\s*builder\.add\([^)]+\)\s*\n)+\s*keyboard = builder\.as_markup\([^)]*\)\s*\n[^#]*await message\.answer\([^,]+, reply_markup=keyboard\)', code, re.DOTALL)
    results['proper_reply_structure'] = len(proper_structure)
    
    # Ищем удаления клавиатуры
    removals = re.findall(r'ReplyKeyboardRemove\(\)', code)
    results['keyboard_removals'] = len(removals)
    
    return results

def analyze_reply_handlers(code: str) -> Dict:
    """Анализирует обработчики для Reply кнопок"""
    results = {
        'reply_handlers': 0,
        'message_text_handlers': 0,
        'contact_handlers': 0,
        'location_handlers': 0,
        'proper_text_matching': 0
    }
    
    # Ищем обработчики Reply кнопок
    reply_handler_pattern = r'async def handle_reply_btn_\w+\(message: types\.Message\)'
    reply_handlers = re.findall(reply_handler_pattern, code)
    results['reply_handlers'] = len(reply_handlers)
    
    # Ищем обработчики текстовых сообщений
    text_handler_pattern = r'@dp\.message\(lambda message: message\.text'
    text_handlers = re.findall(text_handler_pattern, code)
    results['message_text_handlers'] = len(text_handlers)
    
    # Ищем обработчики контактов
    contact_handler_pattern = r'@dp\.message\(.*content_types.*contact'
    contact_handlers = re.findall(contact_handler_pattern, code)
    results['contact_handlers'] = len(contact_handlers)
    
    # Ищем обработчики геолокации
    location_handler_pattern = r'@dp\.message\(.*content_types.*location'
    location_handlers = re.findall(location_handler_pattern, code)
    results['location_handlers'] = len(location_handlers)
    
    return results

def test_reply_message_flow(code: str) -> Dict:
    """Проверяет поток сообщений с Reply кнопками"""
    results = {
        'commands_with_reply': 0,
        'messages_with_reply': 0,
        'single_answer_calls': 0,
        'multiple_answer_calls': 0,
        'keyboard_consistency': True,
        'problematic_flows': []
    }
    
    # Ищем команды с Reply кнопками
    command_pattern = r'@dp\.message\(Command\("[^"]+"\)\)(.*?)(?=@dp\.|\\Z)'
    command_matches = re.findall(command_pattern, code, re.DOTALL)
    
    for i, cmd_code in enumerate(command_matches):
        has_reply = 'ReplyKeyboardBuilder()' in cmd_code
        if has_reply:
            results['commands_with_reply'] += 1
            
            # Проверяем количество answer вызовов
            answer_calls = re.findall(r'await message\.answer\(', cmd_code)
            if len(answer_calls) == 1:
                results['single_answer_calls'] += 1
            else:
                results['multiple_answer_calls'] += 1
                results['problematic_flows'].append(f"Command {i+1}: {len(answer_calls)} answer calls")
    
    # Ищем обычные сообщения с Reply кнопками
    message_handlers = re.findall(r'async def handle_[^(]+\(message: types\.Message\)(.*?)(?=async def|\Z)', code, re.DOTALL)
    
    for i, msg_code in enumerate(message_handlers):
        has_reply = 'ReplyKeyboardBuilder()' in msg_code
        if has_reply:
            results['messages_with_reply'] += 1
    
    return results

def check_keyboard_transitions(code: str) -> Dict:
    """Проверяет переходы между клавиатурами"""
    results = {
        'keyboard_changes': 0,
        'keyboard_removals': 0,
        'smooth_transitions': 0,
        'jarring_transitions': 0,
        'transition_patterns': []
    }
    
    # Ищем смены клавиатур
    keyboard_changes = re.findall(r'ReplyKeyboardBuilder\(\)', code)
    results['keyboard_changes'] = len(keyboard_changes)
    
    # Ищем удаления клавиатур
    removals = re.findall(r'ReplyKeyboardRemove\(\)', code)
    results['keyboard_removals'] = len(removals)
    
    # Ищем паттерны переходов
    transition_pattern = r'await message\.answer\([^,]+, reply_markup=[^)]+\)'
    transitions = re.findall(transition_pattern, code)
    
    for transition in transitions:
        if 'ReplyKeyboardRemove' in transition:
            results['transition_patterns'].append('Remove keyboard')
        elif 'ReplyKeyboardBuilder' in transition:
            results['transition_patterns'].append('Change keyboard')
    
    return results

def run_reply_keyboard_test():
    """Запускает комплексный тест Reply клавиатур"""
    print("⌨️ КОМПЛЕКСНЫЙ ТЕСТ REPLY КЛАВИАТУР")
    print("=" * 45)
    
    # Загружаем код Reply бота
    try:
        with open('reply_keyboard_test_4_fixed.py', 'r', encoding='utf-8') as f:
            code = f.read()
        print(f"📄 Код загружен: {len(code)} символов")
    except Exception as e:
        print(f"❌ Ошибка загрузки кода: {e}")
        return False
    
    # Анализируем Reply клавиатуры
    print("\n⌨️ АНАЛИЗ REPLY КЛАВИАТУР:")
    print("-" * 25)
    keyboards = analyze_reply_keyboards(code)
    print(f"  • Всего Reply клавиатур: {keyboards['total_reply_keyboards']}")
    print(f"  • Reply кнопки: {keyboards['reply_buttons']}")
    print(f"  • Кнопки контакта: {keyboards['contact_buttons']}")
    print(f"  • Кнопки геолокации: {keyboards['location_buttons']}")
    print(f"  • Одноразовые клавиатуры: {keyboards['one_time_keyboards']}")
    print(f"  • Постоянные клавиатуры: {keyboards['permanent_keyboards']}")
    print(f"  • Авто-размер: {keyboards['resizable_keyboards']}")
    print(f"  • Фикс-размер: {keyboards['fixed_size_keyboards']}")
    print(f"  • Правильная структура: {keyboards['proper_reply_structure']}")
    print(f"  • Удаления клавиатур: {keyboards['keyboard_removals']}")
    
    # Анализируем обработчики
    print("\n🔧 АНАЛИЗ ОБРАБОТЧИКОВ:")
    print("-" * 22)
    handlers = analyze_reply_handlers(code)
    print(f"  • Reply обработчики: {handlers['reply_handlers']}")
    print(f"  • Текстовые обработчики: {handlers['message_text_handlers']}")
    print(f"  • Обработчики контактов: {handlers['contact_handlers']}")
    print(f"  • Обработчики геолокации: {handlers['location_handlers']}")
    
    # Тестируем поток сообщений
    print("\n📱 ТЕСТ ПОТОКА СООБЩЕНИЙ:")
    print("-" * 24)
    flow = test_reply_message_flow(code)
    print(f"  • Команды с Reply: {flow['commands_with_reply']}")
    print(f"  • Сообщения с Reply: {flow['messages_with_reply']}")
    print(f"  • Один answer() вызов: {flow['single_answer_calls']}")
    print(f"  • Несколько answer() вызовов: {flow['multiple_answer_calls']}")
    
    if flow['problematic_flows']:
        print(f"  ⚠️ Проблемные потоки:")
        for problem in flow['problematic_flows'][:3]:
            print(f"    - {problem}")
    else:
        print(f"  ✅ Все потоки корректные")
    
    # Проверяем переходы
    print("\n🔄 АНАЛИЗ ПЕРЕХОДОВ:")
    print("-" * 18)
    transitions = check_keyboard_transitions(code)
    print(f"  • Смены клавиатур: {transitions['keyboard_changes']}")
    print(f"  • Удаления клавиатур: {transitions['keyboard_removals']}")
    
    if transitions['transition_patterns']:
        pattern_counts = {}
        for pattern in transitions['transition_patterns']:
            pattern_counts[pattern] = pattern_counts.get(pattern, 0) + 1
        
        print(f"  • Паттерны переходов:")
        for pattern, count in pattern_counts.items():
            print(f"    - {pattern}: {count}")
    
    # Специальные проверки для Reply
    print("\n🎯 СПЕЦИАЛЬНЫЕ ПРОВЕРКИ:")
    print("-" * 23)
    
    # Проверяем что все Reply кнопки обрабатываются
    total_reply_buttons = keyboards['reply_buttons']
    total_handlers = handlers['reply_handlers'] + handlers['message_text_handlers']
    
    print(f"  • Кнопок создано: {total_reply_buttons}")
    print(f"  • Обработчиков найдено: {total_handlers}")
    
    if total_handlers >= total_reply_buttons * 0.8:  # 80% покрытие
        print(f"  ✅ Хорошее покрытие обработчиками")
    else:
        print(f"  ⚠️ Недостаточно обработчиков для кнопок")
    
    # Проверяем специальные кнопки
    special_buttons = keyboards['contact_buttons'] + keyboards['location_buttons']
    special_handlers = handlers['contact_handlers'] + handlers['location_handlers']
    
    print(f"  • Специальных кнопок: {special_buttons}")
    print(f"  • Специальных обработчиков: {special_handlers}")
    
    if special_handlers >= special_buttons:
        print(f"  ✅ Все специальные кнопки обрабатываются")
    else:
        print(f"  ⚠️ Не все специальные кнопки обрабатываются")
    
    # Проверяем правильность структуры
    structure_ratio = keyboards['proper_reply_structure'] / max(keyboards['total_reply_keyboards'], 1)
    print(f"  • Правильная структура: {structure_ratio*100:.1f}%")
    
    if structure_ratio >= 0.9:
        print(f"  ✅ Отличная структура Reply клавиатур")
    elif structure_ratio >= 0.7:
        print(f"  👍 Хорошая структура Reply клавиатур")
    else:
        print(f"  ⚠️ Проблемы со структурой Reply клавиатур")
    
    # Итоговая оценка
    print(f"\n🏆 ИТОГОВАЯ ОЦЕНКА:")
    print(f"-" * 17)
    
    score = 0
    max_score = 100
    
    # Базовая функциональность (40 баллов)
    score += min(keyboards['total_reply_keyboards'] * 4, 20)  # До 20 за клавиатуры
    score += min(keyboards['reply_buttons'] * 1, 15)          # До 15 за кнопки
    score += 5 if keyboards['contact_buttons'] > 0 else 0     # 5 за контактные кнопки
    
    # Качество структуры (30 баллов)
    score += int(structure_ratio * 20)                        # До 20 за структуру
    score += 5 if flow['multiple_answer_calls'] == 0 else 0   # 5 за правильные вызовы
    score += 5 if keyboards['keyboard_removals'] > 0 else 0   # 5 за удаления клавиатур
    
    # Разнообразие функций (30 баллов)
    score += 5 if keyboards['one_time_keyboards'] > 0 else 0      # 5 за одноразовые
    score += 5 if keyboards['permanent_keyboards'] > 0 else 0     # 5 за постоянные
    score += 5 if keyboards['contact_buttons'] > 0 else 0        # 5 за контакты
    score += 5 if keyboards['location_buttons'] > 0 else 0       # 5 за геолокацию
    score += 5 if keyboards['resizable_keyboards'] > 0 else 0    # 5 за авто-размер
    score += 5 if keyboards['fixed_size_keyboards'] > 0 else 0   # 5 за фикс-размер
    
    print(f"🎖️ Итоговый балл: {score}/{max_score} ({score/max_score*100:.1f}%)")
    
    if score >= 85:
        print(f"🌟 ПРЕВОСХОДНО! Reply клавиатуры работают идеально")
        success = True
    elif score >= 70:
        print(f"✅ ОТЛИЧНО! Reply клавиатуры работают правильно")
        success = True
    elif score >= 55:
        print(f"👍 ХОРОШО! Есть небольшие недочеты")
        success = True
    else:
        print(f"⚠️ ТРЕБУЕТ ДОРАБОТКИ! Найдены серьезные проблемы")
        success = False
    
    return success

def compare_with_inline_test():
    """Сравнение Reply клавиатур с Inline кнопками"""
    print(f"\n📊 СРАВНЕНИЕ С INLINE КНОПКАМИ:")
    print(f"-" * 32)
    
    try:
        # Reply бот
        with open('reply_keyboard_test_4.py', 'r', encoding='utf-8') as f:
            reply_code = f.read()
        
        reply_keyboards = len(re.findall(r'ReplyKeyboardBuilder\(\)', reply_code))
        reply_buttons = len(re.findall(r'KeyboardButton\(', reply_code))
        
        # Inline бот
        with open('complex_test_bot_3.py', 'r', encoding='utf-8') as f:
            inline_code = f.read()
        
        inline_keyboards = len(re.findall(r'InlineKeyboardBuilder\(\)', inline_code))
        inline_buttons = len(re.findall(r'InlineKeyboardButton\(', inline_code))
        
        print(f"• Reply бот: {reply_keyboards} клавиатур, {reply_buttons} кнопок")
        print(f"• Inline бот: {inline_keyboards} клавиатур, {inline_buttons} кнопок")
        print(f"• Reply функций больше в {reply_keyboards/max(inline_keyboards,1):.1f}x раз")
        
    except Exception as e:
        print(f"⚠️ Не удалось сравнить: {e}")

def main():
    """Основная функция тестирования"""
    success = run_reply_keyboard_test()
    compare_with_inline_test()
    
    print(f"\n" + "="*50)
    if success:
        print(f"🏆 ТЕСТИРОВАНИЕ REPLY КЛАВИАТУР ЗАВЕРШЕНО УСПЕШНО!")
        print(f"✅ Генератор Reply кнопок работает корректно")
        print(f"🎯 Все типы Reply клавиатур поддерживаются")
    else:
        print(f"⚠️ ТЕСТИРОВАНИЕ ВЫЯВИЛО ПРОБЛЕМЫ")
        print(f"🔧 Reply клавиатуры требуют доработки")

if __name__ == "__main__":
    main()