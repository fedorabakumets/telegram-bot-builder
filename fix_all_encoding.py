#!/usr/bin/env python3
"""
Скрипт для автоматического исправления кодировки CP1251 -> UTF-8 в файле bot-generator.ts
"""

import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

FILE_PATH = r'c:\Users\1\Desktop\telegram-bot-builder\client\lib\bot-generator.ts'

def fix_all_encoding():
    if not os.path.exists(FILE_PATH):
        print(f"Файл не найден: {FILE_PATH}")
        return False
    
    with open(FILE_PATH, 'rb') as f:
        content = f.read()
    
    original_content = content
    replaced_count = 0
    
    # Проходим по всем строкам
    lines = content.split(b'\n')
    new_lines = []
    
    for i, line in enumerate(lines):
        # Проверяем, содержит ли строка байты CP1251
        has_cp1251 = False
        for byte in line:
            if 0xC0 <= byte <= 0xFF:
                has_cp1251 = True
                break
        
        if has_cp1251:
            # Пробуем декодировать как CP1251 и перекодировать в UTF-8
            try:
                decoded = line.decode('cp1251')
                # Проверяем, есть ли кириллица
                if any('\u0400' <= c <= '\u04FF' for c in decoded):
                    # Перекодируем в UTF-8
                    encoded = decoded.encode('utf-8')
                    new_lines.append(encoded)
                    replaced_count += 1
                    if replaced_count <= 10:  # Показываем первые 10 замен
                        print(f"✅ Строка {i}: {decoded[:80]}...")
                else:
                    new_lines.append(line)
            except:
                new_lines.append(line)
        else:
            new_lines.append(line)
    
    new_content = b'\n'.join(new_lines)
    
    if new_content != original_content:
        with open(FILE_PATH, 'wb') as f:
            f.write(new_content)
        print(f"\n🎉 Исправлено {replaced_count} строк(и)!")
        print(f"Файл сохранён: {FILE_PATH}")
        return True
    else:
        print("\n❌ Никаких замен не произведено.")
        return False

if __name__ == '__main__':
    fix_all_encoding()
