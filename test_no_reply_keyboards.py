#!/usr/bin/env python3
"""
Тест для проверки кода БЕЗ reply клавиатур
"""
import asyncio
import aiohttp
import re

async def test_no_reply_keyboards():
    """Тестирует корректность кода БЕЗ reply клавиатур"""
    
    print("🚀 Тестирование кода БЕЗ reply клавиатур...")
    
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
    
    # Тест 2: Проверяем сгенерированный код
    print("\n🔄 Тест 2: Анализ сгенерированного кода")
    try:
        with open('bots/bot_1.py', 'r', encoding='utf-8') as f:
            bot_code = f.read()
        
        # Проверяем импорт ReplyKeyboardRemove
        if 'ReplyKeyboardRemove' in bot_code:
            print("✅ ReplyKeyboardRemove импортирован")
        else:
            print("❌ ReplyKeyboardRemove не найден в импортах")
            return False
        
        # Проверяем, что НЕТ создания reply клавиатур
        if 'ReplyKeyboardBuilder()' not in bot_code:
            print("✅ ReplyKeyboardBuilder НЕ используется (правильно)")
        else:
            print("❌ ReplyKeyboardBuilder найден в коде (не должно быть)")
            return False
            
        # Проверяем, что НЕТ создания inline клавиатур
        if 'InlineKeyboardBuilder()' not in bot_code:
            print("✅ InlineKeyboardBuilder НЕ используется (правильно)")
        else:
            print("❌ InlineKeyboardBuilder найден в коде (не должно быть)")
            return False
        
        # Проверяем использование ReplyKeyboardRemove во всех обработчиках
        handlers = re.findall(r'async def (\w+_handler)', bot_code)
        remove_calls = bot_code.count('ReplyKeyboardRemove()')
        
        print(f"✅ Найдено {len(handlers)} обработчиков")
        print(f"✅ Найдено {remove_calls} вызовов ReplyKeyboardRemove()")
        
        if remove_calls >= len(handlers):
            print("✅ ReplyKeyboardRemove() используется во всех обработчиках")
        else:
            print("❌ ReplyKeyboardRemove() используется не во всех обработчиках")
            return False
            
        # Проверяем конкретные обработчики
        expected_handlers = [
            'start_handler',
            'help_handler', 
            'message_msg_1_handler'
        ]
        
        for handler in expected_handlers:
            if handler in bot_code:
                print(f"✅ {handler} найден")
                
                # Проверяем, что в каждом обработчике есть ReplyKeyboardRemove
                handler_start = bot_code.find(f'async def {handler}')
                if handler_start != -1:
                    next_handler = bot_code.find('async def ', handler_start + 1)
                    if next_handler == -1:
                        next_handler = len(bot_code)
                    
                    handler_code = bot_code[handler_start:next_handler]
                    if 'ReplyKeyboardRemove()' in handler_code:
                        print(f"✅ {handler} использует ReplyKeyboardRemove()")
                    else:
                        print(f"❌ {handler} НЕ использует ReplyKeyboardRemove()")
                        return False
            else:
                print(f"❌ {handler} не найден")
                return False
        
        print("✅ Все обработчики корректны")
        
    except Exception as e:
        print(f"❌ Ошибка чтения файла бота: {e}")
        return False
    
    # Тест 3: Проверяем структуру проекта
    print("\n🔄 Тест 3: Проверка структуры проекта")
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get('http://localhost:5000/api/projects/1') as response:
                if response.status == 200:
                    project_data = await response.json()
                    nodes = project_data['data']['nodes']
                    
                    print(f"✅ Проект содержит {len(nodes)} узлов")
                    
                    # Проверяем, что все узлы имеют keyboardType: "none"
                    all_none = True
                    for node in nodes:
                        keyboard_type = node['data'].get('keyboardType', 'none')
                        if keyboard_type != 'none':
                            print(f"❌ Узел {node['id']} имеет keyboardType: {keyboard_type}")
                            all_none = False
                        else:
                            print(f"✅ Узел {node['id']} имеет keyboardType: none")
                    
                    if all_none:
                        print("✅ Все узлы имеют keyboardType: none")
                    else:
                        print("❌ Не все узлы имеют keyboardType: none")
                        return False
                        
                    # Проверяем, что все узлы НЕ имеют кнопок
                    no_buttons = True
                    for node in nodes:
                        buttons = node['data'].get('buttons', [])
                        if buttons:
                            print(f"❌ Узел {node['id']} имеет кнопки: {buttons}")
                            no_buttons = False
                        else:
                            print(f"✅ Узел {node['id']} не имеет кнопок")
                    
                    if no_buttons:
                        print("✅ Все узлы не имеют кнопок")
                    else:
                        print("❌ Некоторые узлы имеют кнопки")
                        return False
                        
                else:
                    print(f"❌ Ошибка получения проекта: {response.status}")
                    return False
                    
        except Exception as e:
            print(f"❌ Ошибка получения проекта: {e}")
            return False
    
    # Тест 4: Проверяем финальный код
    print("\n🔄 Тест 4: Финальная проверка кода")
    
    # Выводим ключевые части кода
    print("\n📝 Ключевые части сгенерированного кода:")
    print("=" * 50)
    
    lines = bot_code.split('\n')
    for i, line in enumerate(lines):
        if 'ReplyKeyboardRemove' in line:
            print(f"Строка {i+1}: {line.strip()}")
    
    print("=" * 50)
    
    print("\n🎉 Тест успешно завершен!")
    
    # Итоговые результаты
    print("\n📊 Результаты тестирования:")
    print("✅ Бот работает без ошибок")
    print("✅ ReplyKeyboardRemove импортирован и используется")
    print("✅ НЕТ создания reply или inline клавиатур")
    print("✅ Все обработчики удаляют предыдущие клавиатуры")
    print("✅ Все узлы имеют keyboardType: none")
    print("✅ Все узлы не имеют кнопок")
    
    return True

if __name__ == "__main__":
    asyncio.run(test_no_reply_keyboards())