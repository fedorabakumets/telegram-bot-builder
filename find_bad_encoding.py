#!/usr/bin/env python3
"""
Скрипт для поиска всех символов с неправильной кодировкой в файле
"""

import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

FILE_PATH = r'c:\Users\1\Desktop\telegram-bot-builder\client\lib\bot-generator.ts'

def find_bad_encoding():
    if not os.path.exists(FILE_PATH):
        print(f"Файл не найден: {FILE_PATH}")
        return
    
    with open(FILE_PATH, 'rb') as f:
        content = f.read()
    
    lines = content.split(b'\n')
    
    print("🔍 Поиск строк с кодировкой CP1251 (русские символы)...\n")
    
    found_count = 0
    for i, line in enumerate(lines):
        # Ищем байты CP1251 для русских букв (0xC0-0xFF в определённых паттернах)
        has_cp1251 = False
        for byte in line:
            if 0xC0 <= byte <= 0xFF:
                # Проверяем, не является ли это частью UTF-8
                has_cp1251 = True
                break
        
        if has_cp1251:
            # Пробуем декодировать как CP1251
            try:
                decoded = line.decode('cp1251')
                if any('\u0400' <= c <= '\u04FF' for c in decoded):  # Кириллица
                    print(f"📍 Строка {i}: CP1251 найдена")
                    print(f"   {decoded[:200]}")
                    print(f"   Bytes: {line[:100]!r}\n")
                    found_count += 1
            except:
                pass
    
    print(f"\n✅ Найдено строк с CP1251: {found_count}")

if __name__ == '__main__':
    find_bad_encoding()
