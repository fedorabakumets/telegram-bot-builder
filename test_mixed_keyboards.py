"""
Комплексный тест для смешанных клавиатур (Reply + Inline)
"""

import re
from typing import Dict, List

def analyze_mixed_keyboards(code: str) -> Dict:
    """Анализирует смешанные клавиатуры в коде"""
    
    # Reply клавиатуры
    reply_keyboards = re.findall(r'ReplyKeyboardBuilder\(\)', code)
    reply_buttons = re.findall(r'KeyboardButton\(text="([^"]+)"', code)
    reply_special_buttons = re.findall(r'KeyboardButton\(text="[^"]+", request_(contact|location)=True\)', code)
    
    # Inline клавиатуры
    inline_keyboards = re.findall(r'InlineKeyboardBuilder\(\)', code)
    inline_buttons = re.findall(r'InlineKeyboardButton\(text="([^"]+)"', code)
    inline_url_buttons = re.findall(r'InlineKeyboardButton\(text="[^"]+", url="([^"]+)"\)', code)
    inline_callback_buttons = re.findall(r'InlineKeyboardButton\(text="[^"]+", callback_data="([^"]+)"\)', code)
    
    # Удаления клавиатур
    keyboard_removals = re.findall(r'ReplyKeyboardRemove\(\)', code)
    
    # Настройки клавиатур
    one_time_keyboards = re.findall(r'one_time_keyboard=True', code)
    resize_keyboards = re.findall(r'resize_keyboard=True', code)
    
    return {
        'reply_keyboards': len(reply_keyboards),
        'reply_buttons': len(reply_buttons),
        'reply_special_buttons': len(reply_special_buttons),
        'inline_keyboards': len(inline_keyboards),
        'inline_buttons': len(inline_buttons),
        'inline_url_buttons': len(inline_url_buttons),
        'inline_callback_buttons': len(inline_callback_buttons),
        'keyboard_removals': len(keyboard_removals),
        'one_time_keyboards': len(one_time_keyboards),
        'resize_keyboards': len(resize_keyboards)
    }

def analyze_keyboard_transitions(code: str) -> Dict:
    """Анализирует переходы между типами клавиатур"""
    
    # Переходы из Reply в Inline
    reply_to_inline = 0
    inline_to_reply = 0
    reply_to_none = 0
    inline_to_none = 0
    
    # Анализируем функции обработчиков
    handlers = re.findall(r'async def (handle_[^(]+)\([^)]+\):\s*(.*?)(?=async def|\Z)', code, re.DOTALL)
    
    transition_patterns = []
    
    for handler_name, handler_body in handlers:
        has_reply = 'ReplyKeyboardBuilder' in handler_body
        has_inline = 'InlineKeyboardBuilder' in handler_body
        has_removal = 'ReplyKeyboardRemove' in handler_body
        
        if has_reply and has_inline:
            transition_patterns.append(f"{handler_name}: Reply + Inline")
        elif has_reply:
            transition_patterns.append(f"{handler_name}: Reply only")
        elif has_inline:
            transition_patterns.append(f"{handler_name}: Inline only")
        elif has_removal:
            transition_patterns.append(f"{handler_name}: Keyboard removal")
    
    return {
        'transition_patterns': transition_patterns,
        'mixed_handlers': len([p for p in transition_patterns if 'Reply + Inline' in p]),
        'reply_only_handlers': len([p for p in transition_patterns if 'Reply only' in p]),
        'inline_only_handlers': len([p for p in transition_patterns if 'Inline only' in p]),
        'removal_handlers': len([p for p in transition_patterns if 'removal' in p])
    }

def analyze_navigation_flow(code: str) -> Dict:
    """Анализирует поток навигации между узлами"""
    
    # Обработчики кнопок
    reply_handlers = re.findall(r'@dp\.message\(lambda message: message\.text == "([^"]+)"\)', code)
    callback_handlers = re.findall(r'@dp\.callback_query\(lambda callback_query: callback_query\.data == "([^"]+)"\)', code)
    
    # Специальные обработчики
    contact_handlers = re.findall(r'@dp\.message\(F\.contact\)', code)
    location_handlers = re.findall(r'@dp\.message\(F\.location\)', code)
    
    # URL переходы
    url_patterns = re.findall(r'url="([^"]+)"', code)
    
    # Команды
    command_handlers = re.findall(r'@dp\.message\(Command\("([^"]+)"\)\)', code)
    start_handlers = re.findall(r'@dp\.message\(CommandStart\(\)\)', code)
    
    return {
        'reply_handlers': len(reply_handlers),
        'callback_handlers': len(callback_handlers),
        'contact_handlers': len(contact_handlers),
        'location_handlers': len(location_handlers),
        'url_patterns': len(url_patterns),
        'command_handlers': len(command_handlers),
        'start_handlers': len(start_handlers),
        'total_navigation_points': len(reply_handlers) + len(callback_handlers) + len(contact_handlers) + len(location_handlers)
    }

def check_code_quality(code: str) -> Dict:
    """Проверяет качество сгенерированного кода"""
    
    # Импорты
    has_F_import = 'from aiogram import Bot, Dispatcher, types, F' in code
    has_keyboard_imports = 'ReplyKeyboardBuilder, InlineKeyboardBuilder' in code
    has_proper_imports = 'from aiogram.types import' in code
    
    # Структура кода
    has_main_function = 'async def main():' in code
    has_bot_setup = 'Bot(token=' in code
    has_dispatcher_setup = 'Dispatcher()' in code
    
    # Обработка ошибок
    has_error_handling = 'try:' in code or 'except' in code
    
    # Комментарии
    comment_lines = len(re.findall(r'^\s*#', code, re.MULTILINE))
    total_lines = len(code.splitlines())
    comment_ratio = comment_lines / total_lines if total_lines > 0 else 0
    
    return {
        'has_F_import': has_F_import,
        'has_keyboard_imports': has_keyboard_imports,
        'has_proper_imports': has_proper_imports,
        'has_main_function': has_main_function,
        'has_bot_setup': has_bot_setup,
        'has_dispatcher_setup': has_dispatcher_setup,
        'has_error_handling': has_error_handling,
        'comment_ratio': comment_ratio,
        'total_lines': total_lines
    }

def calculate_mixed_keyboards_score(keyboards: Dict, transitions: Dict, navigation: Dict, quality: Dict) -> int:
    """Вычисляет общий балл для смешанных клавиатур"""
    
    score = 0
    max_score = 100
    
    # Базовая функциональность (40 баллов)
    if keyboards['reply_keyboards'] > 0:
        score += 10
    if keyboards['inline_keyboards'] > 0:
        score += 10
    if keyboards['reply_special_buttons'] > 0:
        score += 10  # Контакт/геолокация
    if keyboards['keyboard_removals'] > 0:
        score += 10  # Удаление клавиатур
    
    # Переходы между типами (30 баллов)
    if transitions['mixed_handlers'] > 0:
        score += 15  # Смешанные обработчики
    if transitions['reply_only_handlers'] > 0:
        score += 5
    if transitions['inline_only_handlers'] > 0:
        score += 5
    if transitions['removal_handlers'] > 0:
        score += 5
    
    # Навигация (20 баллов)
    nav_points = navigation.get('total_navigation_points', 0)
    if nav_points >= 10:
        score += 20
    elif nav_points >= 5:
        score += 15
    elif nav_points >= 2:
        score += 10
    elif nav_points >= 1:
        score += 5
    
    # Качество кода (10 баллов)
    quality_score = 0
    if quality['has_F_import']:
        quality_score += 3
    if quality['has_keyboard_imports']:
        quality_score += 2
    if quality['has_main_function']:
        quality_score += 2
    if quality['comment_ratio'] > 0.1:
        quality_score += 3
    
    score += quality_score
    
    return min(score, max_score)

def run_mixed_keyboards_test():
    """Запускает комплексный тест смешанных клавиатур"""
    
    print("🔄 КОМПЛЕКСНЫЙ ТЕСТ СМЕШАННЫХ КЛАВИАТУР")
    print("=" * 45)
    
    # Загружаем код бота
    try:
        with open('simple_mixed_test_bot.py', 'r', encoding='utf-8') as f:
            code = f.read()
        print(f"📄 Код загружен: {len(code)} символов\n")
    except FileNotFoundError:
        print("❌ Файл simple_mixed_test_bot.py не найден")
        return
    
    # Анализируем компоненты
    keyboards = analyze_mixed_keyboards(code)
    transitions = analyze_keyboard_transitions(code)
    navigation = analyze_navigation_flow(code)
    quality = check_code_quality(code)
    
    # Выводим результаты
    print("⌨️ АНАЛИЗ КЛАВИАТУР:")
    print("-------------------")
    print(f"  • Reply клавиатур: {keyboards['reply_keyboards']}")
    print(f"  • Inline клавиатур: {keyboards['inline_keyboards']}")
    print(f"  • Reply кнопок: {keyboards['reply_buttons']}")
    print(f"  • Inline кнопок: {keyboards['inline_buttons']}")
    print(f"  • Специальных кнопок: {keyboards['reply_special_buttons']}")
    print(f"  • URL кнопок: {keyboards['inline_url_buttons']}")
    print(f"  • Callback кнопок: {keyboards['inline_callback_buttons']}")
    print(f"  • Удалений клавиатур: {keyboards['keyboard_removals']}")
    print(f"  • Одноразовых клавиатур: {keyboards['one_time_keyboards']}")
    print(f"  • Адаптивных клавиатур: {keyboards['resize_keyboards']}")
    
    print(f"\n🔄 АНАЛИЗ ПЕРЕХОДОВ:")
    print("-------------------")
    print(f"  • Смешанных обработчиков: {transitions['mixed_handlers']}")
    print(f"  • Reply-только: {transitions['reply_only_handlers']}")
    print(f"  • Inline-только: {transitions['inline_only_handlers']}")
    print(f"  • Удаление клавиатур: {transitions['removal_handlers']}")
    
    if transitions['transition_patterns']:
        print("  • Паттерны переходов:")
        for pattern in transitions['transition_patterns'][:5]:  # Показываем первые 5
            print(f"    - {pattern}")
        if len(transitions['transition_patterns']) > 5:
            print(f"    ... и ещё {len(transitions['transition_patterns']) - 5}")
    
    print(f"\n🗺️ АНАЛИЗ НАВИГАЦИИ:")
    print("-------------------")
    print(f"  • Reply обработчиков: {navigation['reply_handlers']}")
    print(f"  • Callback обработчиков: {navigation['callback_handlers']}")
    print(f"  • Обработчиков контактов: {navigation['contact_handlers']}")
    print(f"  • Обработчиков геолокации: {navigation['location_handlers']}")
    print(f"  • URL переходов: {navigation['url_patterns']}")
    print(f"  • Команд: {navigation['command_handlers']}")
    print(f"  • Всего точек навигации: {navigation['total_navigation_points']}")
    
    print(f"\n🏗️ КАЧЕСТВО КОДА:")
    print("----------------")
    print(f"  • Импорт F: {'✅' if quality['has_F_import'] else '❌'}")
    print(f"  • Импорты клавиатур: {'✅' if quality['has_keyboard_imports'] else '❌'}")
    print(f"  • Основная функция: {'✅' if quality['has_main_function'] else '❌'}")
    print(f"  • Комментарии: {quality['comment_ratio']:.1%}")
    print(f"  • Строк кода: {quality['total_lines']}")
    
    # Вычисляем итоговый балл
    score = calculate_mixed_keyboards_score(keyboards, transitions, navigation, quality)
    
    print(f"\n🏆 ИТОГОВАЯ ОЦЕНКА:")
    print("-----------------")
    print(f"🎖️ Итоговый балл: {score}/100 ({score}%)")
    
    if score >= 90:
        print("🏆 ОТЛИЧНО! Смешанные клавиатуры работают идеально")
    elif score >= 75:
        print("👍 ХОРОШО! Смешанные клавиатуры работают корректно")
    elif score >= 60:
        print("⚠️ УДОВЛЕТВОРИТЕЛЬНО! Есть недочеты в смешанных клавиатурах")
    else:
        print("❌ ПЛОХО! Смешанные клавиатуры работают неправильно")
    
    return score

def compare_keyboard_types():
    """Сравнительный анализ типов клавиатур"""
    
    print(f"\n📊 СРАВНИТЕЛЬНЫЙ АНАЛИЗ:")
    print("------------------------")
    
    # Загружаем разные типы ботов для сравнения
    bots_data = {}
    
    files_to_compare = [
        ('mixed_keyboards_test_bot.py', 'Смешанные клавиатуры'),
        ('reply_keyboard_test_4_final.py', 'Reply клавиатуры'),
        ('complex_test_bot_3.py', 'Inline клавиатуры')
    ]
    
    for filename, bot_type in files_to_compare:
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                code = f.read()
                keyboards = analyze_mixed_keyboards(code)
                navigation = analyze_navigation_flow(code)
                bots_data[bot_type] = {
                    'reply_keyboards': keyboards['reply_keyboards'],
                    'inline_keyboards': keyboards['inline_keyboards'],
                    'total_buttons': keyboards['reply_buttons'] + keyboards['inline_buttons'],
                    'special_buttons': keyboards['reply_special_buttons'],
                    'navigation_points': navigation['total_navigation_points']
                }
        except FileNotFoundError:
            continue
    
    if bots_data:
        for bot_type, data in bots_data.items():
            print(f"\n{bot_type}:")
            print(f"  • Reply клавиатур: {data['reply_keyboards']}")
            print(f"  • Inline клавиатур: {data['inline_keyboards']}")
            print(f"  • Всего кнопок: {data['total_buttons']}")
            print(f"  • Специальных кнопок: {data['special_buttons']}")
            print(f"  • Точек навигации: {data['navigation_points']}")

def main():
    """Основная функция тестирования смешанных клавиатур"""
    score = run_mixed_keyboards_test()
    compare_keyboard_types()
    
    print(f"\n{'=' * 50}")
    print("🏆 ТЕСТИРОВАНИЕ СМЕШАННЫХ КЛАВИАТУР ЗАВЕРШЕНО!")
    
    if score is not None and score >= 75:
        print("✅ Генератор смешанных клавиатур работает корректно")
        print("🎯 Все типы переходов поддерживаются")
    else:
        print("⚠️ Требуется доработка генератора смешанных клавиатур")
        print("🔧 Обнаружены проблемы с переходами между типами")

if __name__ == "__main__":
    main()