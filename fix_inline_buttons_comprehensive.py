#!/usr/bin/env python3
"""
Комплексное исправление проблем с inline кнопками
"""

import os
import re
import sys
import json
import subprocess
from pathlib import Path

def fix_command_syntax_errors(code_content):
    """Исправляет синтаксические ошибки в командах"""
    # Исправляем Command(")help") -> Command("help")
    fixed_code = re.sub(r'Command\("\)([^"]+)"\)', r'Command("\1")', code_content)
    
    # Исправляем любые другие проблемы с командами
    fixed_code = re.sub(r'Command\("([^"]*)\)([^"]*)"', r'Command("\1\2")', fixed_code)
    
    return fixed_code

def fix_boolean_values(code_content):
    """Исправляет JavaScript boolean values на Python boolean values"""
    # Исправляем все true/false в параметрах клавиатуры
    fixed_code = re.sub(r'resize_keyboard=true', 'resize_keyboard=True', code_content)
    fixed_code = re.sub(r'resize_keyboard=false', 'resize_keyboard=False', fixed_code)
    fixed_code = re.sub(r'one_time_keyboard=true', 'one_time_keyboard=True', fixed_code)
    fixed_code = re.sub(r'one_time_keyboard=false', 'one_time_keyboard=False', fixed_code)
    
    return fixed_code

def fix_empty_callback_data(code_content):
    """Исправляет пустые callback_data"""
    # Удаляем строки с пустыми callback_data
    lines = code_content.split('\n')
    fixed_lines = []
    
    for line in lines:
        if 'callback_data=""' in line:
            print(f"⚠️  Удаляем строку с пустым callback_data: {line.strip()}")
            continue
        fixed_lines.append(line)
    
    return '\n'.join(fixed_lines)

def fix_string_interpolation(code_content):
    """Исправляет проблемы с интерполяцией строк"""
    # Исправляем проблемы с многострочными строками
    fixed_code = re.sub(r'text = "([^"]*)\n', r'text = """\1\n', code_content)
    
    return fixed_code

def test_python_syntax(code_content):
    """Проверяет синтаксис Python кода"""
    try:
        compile(code_content, '<string>', 'exec')
        return True, "Код синтаксически корректен"
    except SyntaxError as e:
        return False, f"Синтаксическая ошибка на строке {e.lineno}: {e.msg}"

def apply_all_fixes(code_content):
    """Применяет все исправления к коду"""
    print("🔧 Применяем исправления...")
    
    # 1. Исправляем команды
    print("1. Исправление синтаксиса команд...")
    code_content = fix_command_syntax_errors(code_content)
    
    # 2. Исправляем boolean значения
    print("2. Исправление boolean значений...")
    code_content = fix_boolean_values(code_content)
    
    # 3. Исправляем пустые callback_data
    print("3. Исправление пустых callback_data...")
    code_content = fix_empty_callback_data(code_content)
    
    # 4. Исправляем строки
    print("4. Исправление строковых литералов...")
    code_content = fix_string_interpolation(code_content)
    
    return code_content

def fix_file(filename):
    """Исправляет конкретный файл"""
    print(f"\n🔧 ИСПРАВЛЕНИЕ ФАЙЛА: {filename}")
    
    if not os.path.exists(filename):
        print(f"❌ Файл {filename} не найден")
        return False
    
    # Читаем оригинальный файл
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
    
    # Применяем исправления
    fixed_code = apply_all_fixes(original_code)
    
    # Проверяем исправленный код
    print("\n5. Проверка исправленного кода:")
    is_valid, message = test_python_syntax(fixed_code)
    if is_valid:
        print(f"✅ {message}")
        
        # Сохраняем исправленный код
        fixed_filename = filename.replace('.py', '_FIXED.py')
        with open(fixed_filename, 'w', encoding='utf-8') as f:
            f.write(fixed_code)
        print(f"✅ Исправленный код сохранен в {fixed_filename}")
        return True
    else:
        print(f"❌ {message}")
        
        # Сохраняем частично исправленный код для анализа
        debug_filename = filename.replace('.py', '_DEBUG.py')
        with open(debug_filename, 'w', encoding='utf-8') as f:
            f.write(fixed_code)
        print(f"🔍 Частично исправленный код сохранен в {debug_filename} для анализа")
        return False

def test_new_generation():
    """Тестирует новую генерацию кода через API"""
    print("\n🧪 ТЕСТИРОВАНИЕ НОВОЙ ГЕНЕРАЦИИ КОДА")
    print("=" * 50)
    
    try:
        # Тестируем генерацию через API
        result = subprocess.run([
            'curl', '-s', '-X', 'POST', 
            'http://localhost:5000/api/projects/907/export',
            '-H', 'Content-Type: application/json'
        ], capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0:
            try:
                data = json.loads(result.stdout)
                if 'code' in data:
                    code = data['code']
                    print("✅ Код успешно сгенерирован через API")
                    
                    # Проверяем код на проблемы
                    issues = []
                    if 'callback_data=""' in code:
                        issues.append("Пустые callback_data")
                    if 'resize_keyboard=true' in code or 'resize_keyboard=false' in code:
                        issues.append("JavaScript boolean values")
                    if 'Command(")"' in code:
                        issues.append("Синтаксис команд")
                    
                    if issues:
                        print(f"❌ Найдены проблемы: {', '.join(issues)}")
                        
                        # Сохраняем код для анализа
                        with open('generated_api_test.py', 'w', encoding='utf-8') as f:
                            f.write(code)
                        print("📝 Код сохранен в generated_api_test.py")
                        
                        # Применяем исправления
                        fixed_code = apply_all_fixes(code)
                        with open('generated_api_test_FIXED.py', 'w', encoding='utf-8') as f:
                            f.write(fixed_code)
                        print("✅ Исправленный код сохранен в generated_api_test_FIXED.py")
                        
                        return False
                    else:
                        print("✅ Код не содержит известных проблем")
                        return True
                else:
                    print("❌ API не вернул поле 'code'")
                    return False
            except json.JSONDecodeError:
                print("❌ Ошибка парсинга JSON ответа от API")
                print(f"Ответ: {result.stdout}")
                return False
        else:
            print(f"❌ Ошибка API: {result.stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        print("❌ Таймаут API запроса")
        return False
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return False

def main():
    """Основная функция"""
    print("🚀 КОМПЛЕКСНОЕ ИСПРАВЛЕНИЕ INLINE КНОПОК")
    print("=" * 50)
    
    # Список файлов для исправления
    test_files = [
        'generated_test_fixed.py',
        'complex_test_bot_3.py',
        'simple_mixed_test_bot.py',
        'reply_keyboard_test_4.py'
    ]
    
    success_count = 0
    for filename in test_files:
        if fix_file(filename):
            success_count += 1
    
    print(f"\n📊 РЕЗУЛЬТАТЫ ИСПРАВЛЕНИЯ: {success_count}/{len(test_files)} файлов")
    
    # Тестируем новую генерацию
    api_works = test_new_generation()
    
    print("\n📋 ФИНАЛЬНЫЙ ОТЧЕТ:")
    print("=" * 50)
    if success_count == len(test_files) and api_works:
        print("✅ Все проблемы исправлены!")
        print("✅ API генерирует корректный код")
        print("\n💡 РЕКОМЕНДАЦИИ:")
        print("1. Inline кнопки должны теперь работать корректно")
        print("2. Команды генерируются с правильным синтаксисом")
        print("3. Boolean значения используют Python True/False")
        print("4. Пустые callback_data исключены")
    else:
        print("❌ Остались проблемы, требующие дополнительного внимания")
        print(f"   Исправленных файлов: {success_count}/{len(test_files)}")
        print(f"   API работает: {'✅' if api_works else '❌'}")
    
    return success_count == len(test_files) and api_works

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)