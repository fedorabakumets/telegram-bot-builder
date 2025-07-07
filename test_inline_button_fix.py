#!/usr/bin/env python3
"""
Тест для проверки и исправления проблемы с inline кнопками
"""

import sys
import os
import re
from pathlib import Path

def test_python_syntax(code_content):
    """Проверяет синтаксис Python кода"""
    try:
        compile(code_content, '<string>', 'exec')
        return True, "Код синтаксически корректен"
    except SyntaxError as e:
        return False, f"Синтаксическая ошибка: {e}"

def fix_boolean_values(code_content):
    """Исправляет JavaScript boolean values на Python boolean values"""
    # Исправляем все true/false в параметрах клавиатуры
    fixed_code = re.sub(r'resize_keyboard=true', 'resize_keyboard=True', code_content)
    fixed_code = re.sub(r'resize_keyboard=false', 'resize_keyboard=False', fixed_code)
    fixed_code = re.sub(r'one_time_keyboard=true', 'one_time_keyboard=True', fixed_code)
    fixed_code = re.sub(r'one_time_keyboard=false', 'one_time_keyboard=False', fixed_code)
    
    return fixed_code

def fix_unclosed_strings(code_content):
    """Исправляет незакрытые многострочные строки"""
    lines = code_content.split('\n')
    fixed_lines = []
    
    for i, line in enumerate(lines):
        # Ищем строки с незакрытыми многострочными текстами
        if 'text = "' in line and line.count('"') == 1:
            # Это начало многострочной строки, но используются одинарные кавычки
            # Заменяем на тройные кавычки
            fixed_line = line.replace('text = "', 'text = """')
            fixed_lines.append(fixed_line)
            
            # Ищем конец этой строки
            j = i + 1
            while j < len(lines) and not lines[j].strip().endswith('"'):
                fixed_lines.append(lines[j])
                j += 1
            
            # Добавляем закрывающие тройные кавычки
            if j < len(lines):
                last_line = lines[j]
                if last_line.strip().endswith('"'):
                    fixed_lines.append(last_line[:-1] + '"""')
                else:
                    fixed_lines.append(last_line + '"""')
            
            # Пропускаем обработанные строки
            i = j
        else:
            fixed_lines.append(line)
    
    return '\n'.join(fixed_lines)

def test_file_fixes(filename):
    """Тестирует исправления для конкретного файла"""
    print(f"\n=== ТЕСТИРОВАНИЕ ФАЙЛА: {filename} ===")
    
    if not os.path.exists(filename):
        print(f"❌ Файл {filename} не найден")
        return False
    
    with open(filename, 'r', encoding='utf-8') as f:
        original_code = f.read()
    
    # Проверяем оригинальный код
    print("1. Проверка оригинального кода:")
    is_valid, message = test_python_syntax(original_code)
    if is_valid:
        print(f"✅ {message}")
        return True
    else:
        print(f"❌ {message}")
    
    # Исправляем boolean значения
    print("\n2. Исправление boolean значений...")
    fixed_code = fix_boolean_values(original_code)
    
    # Проверяем количество исправлений
    true_count = original_code.count('=true')
    false_count = original_code.count('=false')
    print(f"   Найдено true: {true_count}, false: {false_count}")
    
    # Исправляем незакрытые строки
    print("\n3. Исправление незакрытых строк...")
    fixed_code = fix_unclosed_strings(fixed_code)
    
    # Проверяем исправленный код
    print("\n4. Проверка исправленного кода:")
    is_valid, message = test_python_syntax(fixed_code)
    if is_valid:
        print(f"✅ {message}")
        
        # Сохраняем исправленный код
        fixed_filename = filename.replace('.py', '_fixed.py')
        with open(fixed_filename, 'w', encoding='utf-8') as f:
            f.write(fixed_code)
        print(f"✅ Исправленный код сохранен в {fixed_filename}")
        return True
    else:
        print(f"❌ {message}")
        return False

def main():
    """Основная функция тестирования"""
    print("🔧 ТЕСТИРОВАНИЕ ИСПРАВЛЕНИЙ ДЛЯ INLINE КНОПОК")
    print("=" * 50)
    
    # Тестируем известные проблемные файлы
    test_files = [
        'complex_test_bot_3.py',
        'reply_keyboard_test_4.py',
        'simple_mixed_test_bot.py'
    ]
    
    success_count = 0
    for filename in test_files:
        if test_file_fixes(filename):
            success_count += 1
    
    print(f"\n📊 РЕЗУЛЬТАТЫ: {success_count}/{len(test_files)} файлов успешно исправлено")
    
    if success_count == len(test_files):
        print("✅ Все файлы успешно исправлены!")
        print("\n💡 РЕКОМЕНДАЦИИ:")
        print("1. Обновите генератор кода, чтобы он использовал Python True/False")
        print("2. Добавьте проверку синтаксиса при генерации кода")
        print("3. Используйте тройные кавычки для многострочных строк")
    else:
        print("❌ Некоторые файлы не удалось исправить")
    
    return success_count == len(test_files)

if __name__ == "__main__":
    main()