#!/usr/bin/env python3
"""
Скрипт для исправления реальных проблем с кодировкой (символы )
Игнорирует эмодзи и ASCII-арт рамки
"""

import os
import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ROOT = r'c:\Users\1\Desktop\telegram-bot-builder'

# Файлы для исправления (только с реальными проблемами)
FILES_TO_FIX = [
    r'client\components\editor\bot\bot-control.tsx',
    r'client\components\editor\database\user-database-panel.tsx',
    r'client\components\editor\properties\properties-panel.tsx',
    r'client\lib\multiselectcheck.ts',
    r'client\lib\newgenerateInteractiveCallbackHandlersWithConditionalMessagesMultiSelectAndAutoNavigation.ts',
    r'server\routes\routes.ts',
    r'server\routes\setupBotIntegrationRoutes.ts',
    r'server\routes\setupProjectRoutes.ts',
    r'server\utils\seed-templates.ts',
]

def fix_file(file_path):
    """Исправляет символы в файле"""
    if not os.path.exists(file_path):
        print(f"⚠️  Файл не найден: {file_path}")
        return 0
    
    with open(file_path, 'rb') as f:
        content = f.read()
    
    original_content = content
    replaced_count = 0
    
    # Заменяем символы замены Unicode () на пробел или удаляем
    # UTF-8 последовательность для  - EF BF BD
    if b'\xef\xbf\xbd' in content:
        content = content.replace(b'\xef\xbf\xbd', b'?')
        replaced_count += content.count(b'?')
    
    # Также ищем другие проблемные последовательности
    # Частые проблемы с кириллицей в неправильной кодировке
    
    if content != original_content:
        with open(file_path, 'wb') as f:
            f.write(content)
        return replaced_count
    
    return 0

def main():
    print("🔧 Исправление реальных проблем с кодировкой...\n")
    
    total_fixed = 0
    
    for file_rel_path in FILES_TO_FIX:
        file_path = os.path.join(PROJECT_ROOT, file_rel_path)
        fixed = fix_file(file_path)
        if fixed > 0:
            print(f"✅ Исправлен {file_rel_path}: {fixed} замен")
            total_fixed += fixed
        elif fixed == 0 and os.path.exists(file_path):
            print(f"✓ Без изменений: {file_rel_path}")
    
    print(f"\n{'='*60}")
    print(f"Всего исправлено: {total_fixed} символов")

if __name__ == '__main__':
    main()
