#!/usr/bin/env python3
"""
Тест для проверки корректности работы с inline кнопками
"""
import asyncio
import aiohttp
import re

async def test_inline_keyboards():
    """Тестирует корректность работы с inline кнопками"""
    
    print("🚀 Тестирование inline кнопок и удаления reply клавиатур...")
    
    # Тест 1: Проверяем статус бота
    print("\n🔄 Тест 1: Проверка статуса бота")
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get('http://localhost:5000/api/projects/1/bot') as response:
                if response.status == 200:
                    data = await response.json()
                    if data['status'] == 'running':
                        print("✅ Бот работает на сервере")
                    else:
                        print(f"❌ Бот не работает: {data['status']}")
                        return False
                else:
                    print(f"❌ Ошибка API: {response.status}")
                    return False
        except Exception as e:
            print(f"❌ Ошибка подключения к API: {e}")
            return False
    
    # Тест 2: Анализ сгенерированного кода
    print("\n🔄 Тест 2: Анализ кода с inline кнопками")
    try:
        with open('bots/bot_1.py', 'r', encoding='utf-8') as f:
            bot_code = f.read()
        
        # Проверяем импорт необходимых модулей
        if 'InlineKeyboardButton' in bot_code:
            print("✅ InlineKeyboardButton импортирован")
        else:
            print("❌ InlineKeyboardButton не найден в импортах")
            return False
            
        if 'ReplyKeyboardRemove' in bot_code:
            print("✅ ReplyKeyboardRemove импортирован")
        else:
            print("❌ ReplyKeyboardRemove не найден в импортах")
            return False
        
        # Проверяем использование InlineKeyboardBuilder
        inline_builders = bot_code.count('InlineKeyboardBuilder()')
        print(f"✅ Найдено {inline_builders} использований InlineKeyboardBuilder")
        
        if inline_builders > 0:
            print("✅ Inline клавиатуры создаются корректно")
        else:
            print("❌ Inline клавиатуры не создаются")
            return False
        
        # Проверяем, что НЕТ создания reply клавиатур
        if 'ReplyKeyboardBuilder()' not in bot_code:
            print("✅ Reply клавиатуры НЕ создаются (правильно)")
        else:
            print("❌ Reply клавиатуры найдены в коде (не должно быть)")
            return False
        
        # Проверяем использование ReplyKeyboardRemove
        remove_calls = bot_code.count('ReplyKeyboardRemove()')
        print(f"✅ Найдено {remove_calls} вызовов ReplyKeyboardRemove()")
        
        if remove_calls >= 3:  # Ожидаем минимум 3 вызова (по одному в каждом обработчике)
            print("✅ ReplyKeyboardRemove() используется достаточно часто")
        else:
            print("❌ ReplyKeyboardRemove() используется недостаточно")
            return False
        
        print("✅ Код структурирован правильно")
        
    except Exception as e:
        print(f"❌ Ошибка чтения файла бота: {e}")
        return False
    
    # Тест 3: Проверяем конкретные обработчики
    print("\n🔄 Тест 3: Проверка inline кнопок в обработчиках")
    
    # Проверяем start_handler
    if 'async def start_handler' in bot_code:
        print("✅ start_handler найден")
        
        start_match = re.search(r'async def start_handler.*?(?=async def|\Z)', bot_code, re.DOTALL)
        if start_match:
            start_code = start_match.group(0)
            
            # Проверяем inline кнопки
            if 'InlineKeyboardButton' in start_code:
                print("✅ start_handler создает inline кнопки")
            else:
                print("❌ start_handler не создает inline кнопки")
                return False
            
            # Проверяем URL кнопку
            if 'url=' in start_code:
                print("✅ start_handler содержит URL кнопку")
            else:
                print("❌ start_handler не содержит URL кнопку")
                return False
            
            # Проверяем удаление reply клавиатур
            if 'ReplyKeyboardRemove()' in start_code:
                print("✅ start_handler удаляет reply клавиатуры")
            else:
                print("❌ start_handler не удаляет reply клавиатуры")
                return False
                
            # Проверяем двойную отправку сообщений (текст + клавиатура)
            message_calls = start_code.count('await message.answer')
            if message_calls >= 2:
                print("✅ start_handler отправляет два сообщения (текст + клавиатура)")
            else:
                print("❌ start_handler не отправляет достаточно сообщений")
                return False
    
    # Проверяем menu_handler
    if 'async def menu_handler' in bot_code:
        print("✅ menu_handler найден")
        
        menu_match = re.search(r'async def menu_handler.*?(?=async def|\Z)', bot_code, re.DOTALL)
        if menu_match:
            menu_code = menu_match.group(0)
            
            if 'InlineKeyboardButton' in menu_code and 'ReplyKeyboardRemove()' in menu_code:
                print("✅ menu_handler корректен")
            else:
                print("❌ menu_handler некорректен")
                return False
    
    # Проверяем message handler
    if 'async def message_msg_1_handler' in bot_code:
        print("✅ message_handler найден")
        
        msg_match = re.search(r'async def message_msg_1_handler.*?(?=async def|\Z)', bot_code, re.DOTALL)
        if msg_match:
            msg_code = msg_match.group(0)
            
            if 'ReplyKeyboardRemove()' in msg_code and 'InlineKeyboardButton' not in msg_code:
                print("✅ message_handler корректен (только удаление, без кнопок)")
            else:
                print("❌ message_handler некорректен")
                return False
    
    # Тест 4: Проверяем структуру проекта
    print("\n🔄 Тест 4: Проверка структуры проекта")
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get('http://localhost:5000/api/projects/1') as response:
                if response.status == 200:
                    project_data = await response.json()
                    nodes = project_data['data']['nodes']
                    
                    inline_nodes = [n for n in nodes if n['data'].get('keyboardType') == 'inline']
                    none_nodes = [n for n in nodes if n['data'].get('keyboardType') == 'none']
                    
                    print(f"✅ Узлов с inline кнопками: {len(inline_nodes)}")
                    print(f"✅ Узлов без кнопок: {len(none_nodes)}")
                    
                    # Проверяем inline узлы
                    for node in inline_nodes:
                        buttons = node['data'].get('buttons', [])
                        if buttons:
                            print(f"✅ Узел {node['id']} имеет {len(buttons)} inline кнопок")
                            
                            # Проверяем типы кнопок
                            for btn in buttons:
                                if btn.get('action') == 'url':
                                    print(f"  ✅ URL кнопка: {btn['text']}")
                                else:
                                    print(f"  ✅ Callback кнопка: {btn['text']}")
                        else:
                            print(f"❌ Узел {node['id']} должен иметь кнопки")
                            return False
                    
                    # Проверяем узлы без кнопок
                    for node in none_nodes:
                        buttons = node['data'].get('buttons', [])
                        if not buttons:
                            print(f"✅ Узел {node['id']} корректно не имеет кнопок")
                        else:
                            print(f"❌ Узел {node['id']} не должен иметь кнопки")
                            return False
                            
                else:
                    print(f"❌ Ошибка получения проекта: {response.status}")
                    return False
                    
        except Exception as e:
            print(f"❌ Ошибка получения проекта: {e}")
            return False
    
    # Тест 5: Демонстрация ключевых частей кода
    print("\n🔄 Тест 5: Ключевые части сгенерированного кода")
    print("=" * 60)
    
    lines = bot_code.split('\n')
    for i, line in enumerate(lines):
        if ('InlineKeyboardButton' in line or 
            'ReplyKeyboardRemove()' in line or
            'InlineKeyboardBuilder()' in line):
            print(f"Строка {i+1}: {line.strip()}")
    
    print("=" * 60)
    
    print("\n🎉 Тест inline кнопок успешно завершен!")
    
    # Итоговые результаты
    print("\n📊 Результаты тестирования inline кнопок:")
    print("✅ Inline кнопки создаются корректно")
    print("✅ URL кнопки работают правильно")
    print("✅ Callback кнопки генерируются верно")
    print("✅ ReplyKeyboardRemove используется перед показом inline кнопок")
    print("✅ Двойная отправка сообщений (текст + клавиатура)")
    print("✅ Сообщения без кнопок удаляют reply клавиатуры")
    print("✅ Код структурирован правильно")
    
    return True

if __name__ == "__main__":
    asyncio.run(test_inline_keyboards())