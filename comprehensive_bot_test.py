#!/usr/bin/env python3
"""
Комплексный тест для анализа сложного бота с множественными узлами
"""

import re
import json
from typing import Dict, List, Set

def load_bot_code(filename: str) -> str:
    """Загружает код бота из файла"""
    with open(filename, 'r', encoding='utf-8') as f:
        return f.read()

def analyze_commands(code: str) -> Dict:
    """Анализирует команды в коде"""
    results = {
        'total_commands': 0,
        'command_handlers': [],
        'start_handler': False,
        'callback_handlers': 0,
        'synonym_handlers': 0
    }
    
    # Ищем command handlers
    command_patterns = re.findall(r'@dp\.message\(Command\("([^"]+)"\)\)', code)
    results['command_handlers'] = command_patterns
    results['total_commands'] = len(command_patterns)
    
    # Проверяем start handler
    start_pattern = re.search(r'@dp\.message\(CommandStart\(\)\)', code)
    results['start_handler'] = bool(start_pattern)
    
    # Ищем callback handlers
    callback_patterns = re.findall(r'@dp\.callback_query\(', code)
    results['callback_handlers'] = len(callback_patterns)
    
    # Ищем synonym handlers
    synonym_patterns = re.findall(r'_synonym_', code)
    results['synonym_handlers'] = len(synonym_patterns)
    
    return results

def analyze_keyboards(code: str) -> Dict:
    """Анализирует клавиатуры в коде"""
    results = {
        'inline_keyboards': 0,
        'reply_keyboards': 0,
        'inline_buttons': 0,
        'reply_buttons': 0,
        'url_buttons': 0,
        'callback_buttons': 0,
        'proper_inline_attachment': 0,
        'proper_reply_attachment': 0
    }
    
    # Анализируем inline клавиатуры
    inline_keyboard_pattern = r'builder = InlineKeyboardBuilder\(\)(.*?)keyboard = builder\.as_markup\(\)(.*?)await message\.answer\([^,]+, reply_markup=keyboard\)'
    inline_matches = re.findall(inline_keyboard_pattern, code, re.DOTALL)
    results['inline_keyboards'] = len(inline_matches)
    results['proper_inline_attachment'] = len(inline_matches)
    
    # Анализируем reply клавиатуры
    reply_keyboard_pattern = r'builder = ReplyKeyboardBuilder\(\)(.*?)keyboard = builder\.as_markup\([^)]*\)(.*?)await message\.answer\([^,]+, reply_markup=keyboard\)'
    reply_matches = re.findall(reply_keyboard_pattern, code, re.DOTALL)
    results['reply_keyboards'] = len(reply_matches)
    results['proper_reply_attachment'] = len(reply_matches)
    
    # Считаем кнопки
    inline_button_patterns = re.findall(r'InlineKeyboardButton\(', code)
    results['inline_buttons'] = len(inline_button_patterns)
    
    reply_button_patterns = re.findall(r'KeyboardButton\(', code)
    results['reply_buttons'] = len(reply_button_patterns)
    
    # Анализируем типы inline кнопок
    url_button_patterns = re.findall(r'InlineKeyboardButton\([^)]*url=', code)
    results['url_buttons'] = len(url_button_patterns)
    
    callback_button_patterns = re.findall(r'InlineKeyboardButton\([^)]*callback_data=', code)
    results['callback_buttons'] = len(callback_button_patterns)
    
    return results

def analyze_message_handlers(code: str) -> Dict:
    """Анализирует обработчики сообщений"""
    results = {
        'total_handlers': 0,
        'command_handlers': 0,
        'callback_handlers': 0,
        'message_answer_calls': 0,
        'duplicate_handlers': [],
        'security_checks': 0
    }
    
    # Считаем все async def функции
    handler_patterns = re.findall(r'async def (\w+)\(', code)
    results['total_handlers'] = len(handler_patterns)
    
    # Проверяем на дубликаты
    handler_counts = {}
    for handler in handler_patterns:
        handler_counts[handler] = handler_counts.get(handler, 0) + 1
    
    results['duplicate_handlers'] = [name for name, count in handler_counts.items() if count > 1]
    
    # Считаем message.answer() вызовы
    answer_patterns = re.findall(r'await message\.answer\(', code)
    results['message_answer_calls'] = len(answer_patterns)
    
    # Считаем проверки безопасности
    security_patterns = re.findall(r'(is_admin|is_private_chat|check_auth)', code)
    results['security_checks'] = len(security_patterns)
    
    return results

def analyze_media_support(code: str) -> Dict:
    """Анализирует поддержку медиа"""
    results = {
        'photo_handlers': 0,
        'video_handlers': 0,
        'audio_handlers': 0,
        'document_handlers': 0,
        'media_send_calls': 0
    }
    
    # Ищем упоминания медиа
    photo_patterns = re.findall(r'(photo|image)', code.lower())
    results['photo_handlers'] = len(photo_patterns)
    
    video_patterns = re.findall(r'video', code.lower())
    results['video_handlers'] = len(video_patterns)
    
    audio_patterns = re.findall(r'audio', code.lower())
    results['audio_handlers'] = len(audio_patterns)
    
    # Ищем медиа отправку
    media_send_patterns = re.findall(r'send_(photo|video|audio|document)', code)
    results['media_send_calls'] = len(media_send_patterns)
    
    return results

def analyze_input_handling(code: str) -> Dict:
    """Анализирует обработку пользовательского ввода"""
    results = {
        'input_handlers': 0,
        'validation_checks': 0,
        'user_data_usage': 0,
        'form_handlers': 0
    }
    
    # Ищем работу с пользовательскими данными
    user_data_patterns = re.findall(r'user_data\[', code)
    results['user_data_usage'] = len(user_data_patterns)
    
    # Ищем валидацию
    validation_patterns = re.findall(r'(validation|validate|required|min:|max:)', code)
    results['validation_checks'] = len(validation_patterns)
    
    return results

def check_code_quality(code: str) -> Dict:
    """Проверяет качество кода"""
    results = {
        'imports_present': False,
        'bot_token_placeholder': False,
        'main_function': False,
        'error_handling': 0,
        'comments_count': 0,
        'docstrings_count': 0,
        'code_length': len(code),
        'functions_count': 0
    }
    
    # Проверяем импорты
    results['imports_present'] = 'from aiogram import' in code
    
    # Проверяем токен
    results['bot_token_placeholder'] = 'YOUR_BOT_TOKEN_HERE' in code
    
    # Проверяем main функцию
    results['main_function'] = 'async def main():' in code
    
    # Считаем обработку ошибок
    error_patterns = re.findall(r'(try:|except|finally:|raise)', code)
    results['error_handling'] = len(error_patterns)
    
    # Считаем комментарии
    comment_patterns = re.findall(r'#[^\n]*', code)
    results['comments_count'] = len(comment_patterns)
    
    # Считаем docstrings
    docstring_patterns = re.findall(r'"""[^"]*"""', code, re.DOTALL)
    results['docstrings_count'] = len(docstring_patterns)
    
    # Считаем функции
    function_patterns = re.findall(r'def \w+\(', code)
    results['functions_count'] = len(function_patterns)
    
    return results

def run_comprehensive_test(filename: str) -> None:
    """Запускает комплексный тест"""
    print("🔍 КОМПЛЕКСНЫЙ АНАЛИЗ СЛОЖНОГО БОТА")
    print("=" * 50)
    
    # Загружаем код
    try:
        code = load_bot_code(filename)
        print(f"✅ Код загружен: {len(code)} символов")
    except Exception as e:
        print(f"❌ Ошибка загрузки кода: {e}")
        return
    
    # Анализируем команды
    print("\n📋 АНАЛИЗ КОМАНД:")
    print("-" * 20)
    commands = analyze_commands(code)
    print(f"  • Всего команд: {commands['total_commands']}")
    print(f"  • Start handler: {'✅' if commands['start_handler'] else '❌'}")
    print(f"  • Команды: {', '.join(commands['command_handlers'])}")
    print(f"  • Callback handlers: {commands['callback_handlers']}")
    print(f"  • Synonym handlers: {commands['synonym_handlers']}")
    
    # Анализируем клавиатуры
    print("\n⌨️ АНАЛИЗ КЛАВИАТУР:")
    print("-" * 20)
    keyboards = analyze_keyboards(code)
    print(f"  • Inline клавиатуры: {keyboards['inline_keyboards']}")
    print(f"  • Reply клавиатуры: {keyboards['reply_keyboards']}")
    print(f"  • Inline кнопки: {keyboards['inline_buttons']}")
    print(f"  • Reply кнопки: {keyboards['reply_buttons']}")
    print(f"  • URL кнопки: {keyboards['url_buttons']}")
    print(f"  • Callback кнопки: {keyboards['callback_buttons']}")
    print(f"  • Правильное прикрепление inline: {keyboards['proper_inline_attachment']}")
    print(f"  • Правильное прикрепление reply: {keyboards['proper_reply_attachment']}")
    
    # Анализируем обработчики
    print("\n🔧 АНАЛИЗ ОБРАБОТЧИКОВ:")
    print("-" * 20)
    handlers = analyze_message_handlers(code)
    print(f"  • Всего обработчиков: {handlers['total_handlers']}")
    print(f"  • Вызовов message.answer(): {handlers['message_answer_calls']}")
    print(f"  • Проверки безопасности: {handlers['security_checks']}")
    if handlers['duplicate_handlers']:
        print(f"  ❌ Дублированные обработчики: {', '.join(handlers['duplicate_handlers'])}")
    else:
        print(f"  ✅ Дублированных обработчиков нет")
    
    # Анализируем медиа
    print("\n🖼️ АНАЛИЗ МЕДИА:")
    print("-" * 20)
    media = analyze_media_support(code)
    print(f"  • Упоминания фото: {media['photo_handlers']}")
    print(f"  • Упоминания видео: {media['video_handlers']}")
    print(f"  • Упоминания аудио: {media['audio_handlers']}")
    print(f"  • Медиа отправка: {media['media_send_calls']}")
    
    # Анализируем ввод
    print("\n✍️ АНАЛИЗ ПОЛЬЗОВАТЕЛЬСКОГО ВВОДА:")
    print("-" * 20)
    input_data = analyze_input_handling(code)
    print(f"  • Использование user_data: {input_data['user_data_usage']}")
    print(f"  • Проверки валидации: {input_data['validation_checks']}")
    
    # Проверяем качество кода
    print("\n⭐ КАЧЕСТВО КОДА:")
    print("-" * 20)
    quality = check_code_quality(code)
    print(f"  • Импорты присутствуют: {'✅' if quality['imports_present'] else '❌'}")
    print(f"  • Placeholder для токена: {'✅' if quality['bot_token_placeholder'] else '❌'}")
    print(f"  • Main функция: {'✅' if quality['main_function'] else '❌'}")
    print(f"  • Обработка ошибок: {quality['error_handling']}")
    print(f"  • Комментарии: {quality['comments_count']}")
    print(f"  • Docstrings: {quality['docstrings_count']}")
    print(f"  • Функции: {quality['functions_count']}")
    print(f"  • Размер кода: {quality['code_length']} символов")
    
    # Проверяем специфические проблемы
    print("\n🔎 ПРОВЕРКА ПРОБЛЕМ:")
    print("-" * 20)
    
    # Проверяем inline кнопки
    inline_issue = False
    for cmd in commands['command_handlers']:
        cmd_pattern = f'@dp\\.message\\(Command\\("{cmd}"\\)\\)(.*?)(?=@|\\Z)'
        cmd_match = re.search(cmd_pattern, code, re.DOTALL)
        if cmd_match:
            cmd_code = cmd_match.group(1)
            answer_count = cmd_code.count('message.answer')
            if answer_count > 1:
                print(f"  ❌ Команда /{cmd}: {answer_count} вызовов message.answer()")
                inline_issue = True
    
    if not inline_issue:
        print("  ✅ Все команды с inline кнопками работают корректно")
    
    # Проверяем отдельные обработчики сообщений
    separate_handlers = re.findall(r'async def handle_[^(]+\(message: types\.Message\)', code)
    if separate_handlers:
        print(f"  ⚠️ Найдены отдельные обработчики сообщений: {len(separate_handlers)}")
        for handler in separate_handlers[:3]:  # Показываем первые 3
            print(f"    - {handler}")
    else:
        print("  ✅ Отдельных обработчиков сообщений нет")
    
    # Общая оценка
    print("\n🎯 ОБЩАЯ ОЦЕНКА:")
    print("-" * 20)
    
    score = 0
    max_score = 100
    
    # Базовая функциональность (40 баллов)
    if commands['start_handler']: score += 5
    score += min(commands['total_commands'] * 3, 15)  # До 15 за команды
    score += min(commands['callback_handlers'] * 2, 20)  # До 20 за callback
    
    # Клавиатуры (30 баллов)
    score += min(keyboards['inline_keyboards'] * 3, 15)  # До 15 за inline
    score += min(keyboards['reply_keyboards'] * 3, 10)   # До 10 за reply
    score += 5 if keyboards['proper_inline_attachment'] > 0 else 0  # 5 за правильное прикрепление
    
    # Качество кода (30 баллов)
    if quality['imports_present']: score += 5
    if quality['main_function']: score += 5
    if not handlers['duplicate_handlers']: score += 10
    if not inline_issue: score += 10
    
    print(f"  🏆 Итоговый балл: {score}/{max_score} ({score/max_score*100:.1f}%)")
    
    if score >= 80:
        print("  🌟 ОТЛИЧНО! Бот генерируется правильно")
    elif score >= 60:
        print("  👍 ХОРОШО! Есть небольшие проблемы")
    elif score >= 40:
        print("  ⚠️ УДОВЛЕТВОРИТЕЛЬНО! Требуются улучшения")
    else:
        print("  ❌ ПЛОХО! Много критических ошибок")

def main():
    """Основная функция тестирования"""
    filename = "complex_test_bot_3.py"
    
    try:
        run_comprehensive_test(filename)
    except Exception as e:
        print(f"❌ Ошибка при выполнении теста: {e}")

if __name__ == "__main__":
    main()