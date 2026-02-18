#!/usr/bin/env python3
"""
Скрипт для исправления оставшихся проблем с кодировкой в bot-generator.ts и других файлах
"""

import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ROOT = r'c:\Users\1\Desktop\telegram-bot-builder'

FILES_TO_FIX = [
    r'client\lib\bot-generator.ts',
    r'client\lib\MediaHandler\generateMediaFileFunctions.ts',
    r'server\utils\seed-templates.ts',
]

def fix_file(file_path):
    """Исправляет кодировку в файле"""
    if not os.path.exists(file_path):
        print(f"⚠️  Файл не найден: {file_path}")
        return 0
    
    with open(file_path, 'rb') as f:
        content = f.read()
    
    original_content = content
    replaced_count = 0
    
    # Заменяем символы замены Unicode () на ?
    if b'\xef\xbf\xbd' in content:
        content = content.replace(b'\xef\xbf\xbd', b'?')
        replaced_count += 1
    
    # Проверяем на двойное кодирование UTF-8 (когда UTF-8 был прочитан как CP1251 и снова закодирован)
    # Это выглядит как "рџљЂ" вместо "🚀"
    lines = content.split(b'\n')
    new_lines = []
    double_encoded_fixed = 0
    
    for line in lines:
        # Проверяем типичные паттерны двойного кодирования
        # рџ =  (U+1F680)
        # Р' = Б (U+0411)
        # и т.д.
        
        # Если строка содержит последовательности вида "С‚" "Р" "РЅ" - это двойное кодирование
        if b'\xd0' in line or b'\xd1' in line:
            try:
                # Пробуем декодировать как UTF-8
                decoded = line.decode('utf-8')
                # Проверяем на наличие "мусорных" символов
                if any(ord(c) > 0x400 and c not in 'абвгдежзийклмнопрстуфхцчшщъыьэюяАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯёЁ—–…""''°±×÷№' for c in decoded):
                    # Это может быть двойное кодирование, пробуем исправить
                    # Декодируем обратно в байты и снова в UTF-8
                    try:
                        # Пробуем "перекодировать" обратно
                        re_encoded = decoded.encode('latin-1').decode('utf-8')
                        new_lines.append(re_encoded.encode('utf-8'))
                        double_encoded_fixed += 1
                        continue
                    except:
                        pass
            except:
                pass
        
        new_lines.append(line)
    
    if double_encoded_fixed > 0:
        content = b'\n'.join(new_lines)
        replaced_count += double_encoded_fixed
    
    if content != original_content:
        with open(file_path, 'wb') as f:
            f.write(content)
        return replaced_count
    
    return 0

def main():
    print("🔧 Исправление оставшихся проблем с кодировкой...\n")
    
    total_fixed = 0
    
    for file_rel_path in FILES_TO_FIX:
        file_path = os.path.join(PROJECT_ROOT, file_rel_path)
        fixed = fix_file(file_path)
        if fixed > 0:
            print(f"✅ Исправлен {file_rel_path}: {fixed} проблем")
            total_fixed += fixed
        elif fixed == 0 and os.path.exists(file_path):
            print(f"✓ Без изменений: {file_rel_path}")
    
    print(f"\n{'='*60}")
    print(f"Всего исправлено: {total_fixed} проблем")

if __name__ == '__main__':
    main()
