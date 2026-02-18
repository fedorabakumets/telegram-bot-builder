#!/usr/bin/env python3
"""
Скрипт для поиска всех файлов с проблемами кодировки (символы ) в проекте
"""

import os
import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ROOT = r'c:\Users\1\Desktop\telegram-bot-builder'

# Директории для проверки
CHECK_DIRS = ['client', 'server']

# Расширения файлов для проверки
TEXT_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.py', '.json', '.md', '.txt', '.html', '.css', '.scss', '.yaml', '.yml']

def find_bad_encoding_in_file(file_path):
    """Ищет символы с проблемами кодировки в файле"""
    problems = []
    
    try:
        with open(file_path, 'rb') as f:
            content = f.read()
        
        # Проверяем наличие символов замены Unicode (U+FFFD) которые выглядят как 
        # Также ищем последовательности байтов которые могут быть проблемами кодировки
        
        # Паттерн для поиска UTF-8 последовательностей которые были декодированы неправильно
        # Это обычно выглядит как  (U+FFFD) или кракозябры
        
        # Проверяем наличие байтов которые могут быть проблемами
        lines = content.split(b'\n')
        for i, line in enumerate(lines, 1):
            # Ищем символы замены Unicode (EF BF BD в UTF-8)
            if b'\xef\xbf\xbd' in line:
                problems.append((i, 'Символ замены Unicode ()', line))
            # Ищем проблемные UTF-8 последовательности
            elif b'\xc2' in line or b'\xc3' in line or b'\xe2' in line:
                # Проверяем, не являются ли это частью валидного UTF-8
                try:
                    decoded = line.decode('utf-8')
                    # Проверяем наличие символов замены
                    if '\ufffd' in decoded:
                        problems.append((i, 'Символ замены в декодированной строке', line))
                    # Проверяем наличие странных символов (например, частые в кракозябрах)
                    elif any(ord(c) > 127 and c not in 'абвгдежзийклмнопрстуфхцчшщъыьэюяАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯёЁ—–…""''°±×÷' for c in decoded):
                        # Проверяем на "мусорные" символы
                        weird_chars = sum(1 for c in decoded if ord(c) > 127 and c not in 'абвгдежзийклмнопрстуфхцчшщъыьэюяАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯёЁ—–…""''°±×÷№')
                        if weird_chars > 3:  # Если много странных символов
                            problems.append((i, f'Много странных символов ({weird_chars})', line[:100]))
                except UnicodeDecodeError:
                    problems.append((i, 'Ошибка декодирования UTF-8', line))
        
        return problems
    except Exception as e:
        return [(0, f'Ошибка чтения файла: {e}', b'')]

def scan_project():
    """Сканирует проект на наличие проблем с кодировкой"""
    print("🔍 Сканирование проекта на наличие проблем с кодировкой...\n")
    
    total_files = 0
    files_with_problems = 0
    total_problems = 0
    
    for check_dir in CHECK_DIRS:
        dir_path = os.path.join(PROJECT_ROOT, check_dir)
        if not os.path.exists(dir_path):
            print(f"⚠️  Директория не найдена: {dir_path}")
            continue
        
        print(f"📁 Проверка директории: {check_dir}/")
        
        for root, dirs, files in os.walk(dir_path):
            # Пропускаем node_modules и другие служебные директории
            dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', 'dist', 'build', '__pycache__']]
            
            for file in files:
                file_ext = os.path.splitext(file)[1].lower()
                if file_ext not in TEXT_EXTENSIONS:
                    continue
                
                file_path = os.path.join(root, file)
                total_files += 1
                
                problems = find_bad_encoding_in_file(file_path)
                
                if problems:
                    files_with_problems += 1
                    total_problems += len(problems)
                    
                    rel_path = os.path.relpath(file_path, PROJECT_ROOT)
                    print(f"\n❌ Файл: {rel_path}")
                    for line_num, problem_type, line_content in problems[:5]:  # Показываем первые 5 проблем
                        try:
                            line_str = line_content.decode('utf-8', errors='replace')[:100]
                        except:
                            line_str = str(line_content)[:100]
                        print(f"   Строка {line_num}: {problem_type}")
                        print(f"   {line_str}...")
                    if len(problems) > 5:
                        print(f"   ... и ещё {len(problems) - 5} проблем")
    
    print("\n" + "="*60)
    print(f"📊 Результаты сканирования:")
    print(f"   Всего файлов проверено: {total_files}")
    print(f"   Файлов с проблемами: {files_with_problems}")
    print(f"   Всего проблем найдено: {total_problems}")
    
    if files_with_problems > 0:
        print(f"\n⚠️  Найдены файлы с проблемами кодировки!")
    else:
        print(f"\n✅ Все файлы в порядке!")

if __name__ == '__main__':
    scan_project()
