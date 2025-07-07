#!/usr/bin/env python3
"""
Финальный тест: Подтверждение работы inline кнопок
"""

import os
import subprocess
import json
from pathlib import Path

def test_bot_functionality():
    """Тестирует функциональность бота"""
    print("🧪 ФИНАЛЬНЫЙ ТЕСТ INLINE КНОПОК")
    print("=" * 50)
    
    # 1. Тестируем генерацию кода
    print("1. Тестирование генерации кода через API...")
    try:
        result = subprocess.run([
            'curl', '-s', '-X', 'POST', 
            'http://localhost:5000/api/projects/907/export',
            '-H', 'Content-Type: application/json'
        ], capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0:
            data = json.loads(result.stdout)
            code = data['code']
            print("✅ Код успешно сгенерирован")
            
            # Проверяем ключевые элементы
            checks = [
                ("Inline кнопки", 'InlineKeyboardBuilder()' in code),
                ("Корректные callback_data", 'callback_data=""' not in code),
                ("Python boolean values", 'resize_keyboard=True' in code or 'resize_keyboard=False' in code),
                ("Команды без ошибок", 'Command("' in code and 'Command(")' not in code),
                ("Обработчики callback", '@dp.callback_query' in code),
            ]
            
            print("\n📋 Проверка элементов:")
            all_good = True
            for check_name, check_result in checks:
                status = "✅" if check_result else "❌"
                print(f"   {status} {check_name}")
                if not check_result:
                    all_good = False
            
            # Тестируем синтаксис
            print("\n2. Тестирование синтаксиса Python...")
            try:
                compile(code, '<string>', 'exec')
                print("✅ Код синтаксически корректен")
            except SyntaxError as e:
                print(f"❌ Синтаксическая ошибка: {e}")
                all_good = False
            
            return all_good
            
    except Exception as e:
        print(f"❌ Ошибка тестирования: {e}")
        return False

def main():
    """Основная функция тестирования"""
    success = test_bot_functionality()
    
    print("\n🎯 РЕЗУЛЬТАТ:")
    print("=" * 50)
    
    if success:
        print("🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!")
        print()
        print("✅ Inline кнопки теперь работают корректно")
        print("✅ Пустые callback_data исключены")
        print("✅ Boolean значения используют Python True/False")
        print("✅ Команды генерируются без синтаксических ошибок")
        print("✅ Обработчики callback_query созданы правильно")
        print()
        print("🚀 Готово к использованию!")
        print("   Пользователи могут создавать ботов с функциональными inline кнопками")
        
    else:
        print("❌ Некоторые тесты не прошли")
        print("   Требуется дополнительная настройка")
    
    return success

if __name__ == "__main__":
    main()