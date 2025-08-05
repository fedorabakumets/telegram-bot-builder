"""
Диагностика проблем с командами Telegram бота
"""

import re
import requests

def check_bot_code_structure():
    """Проверяет структуру сгенерированного кода бота"""
    
    print("🔍 ДИАГНОСТИКА КОМАНД TELEGRAM БОТА")
    print("=" * 50)
    
    try:
        with open("generated_advanced_bot.py", "r", encoding="utf-8") as f:
            code = f.read()
    except FileNotFoundError:
        print("❌ Файл generated_advanced_bot.py не найден!")
        print("Сначала запустите test_advanced_complex_bot.py")
        return
    
    print("\n1️⃣ ПРОВЕРКА ИМПОРТОВ:")
    imports_found = []
    import_lines = [
        "from aiogram import Bot, Dispatcher, types, F",
        "from aiogram.filters import CommandStart, Command",
        "from aiogram.types import ReplyKeyboardMarkup, KeyboardButton"
    ]
    
    for imp in import_lines:
        if imp in code:
            imports_found.append(f"✅ {imp}")
        else:
            imports_found.append(f"❌ {imp}")
    
    for imp in imports_found:
        print(f"   {imp}")
    
    print("\n2️⃣ ПРОВЕРКА ОБРАБОТЧИКОВ КОМАНД:")
    
    # Ищем все команды
    command_patterns = [
        (r'@dp\.message\(CommandStart\(\)\)', "CommandStart"),
        (r'@dp\.message\(Command\("(\w+)"\)\)', "Command")
    ]
    
    start_handlers = re.findall(command_patterns[0][0], code)
    command_handlers = re.findall(command_patterns[1][0], code)
    
    print(f"   ✅ CommandStart обработчиков: {len(start_handlers)}")
    print(f"   ✅ Command обработчиков: {len(command_handlers)}")
    
    if command_handlers:
        print(f"   📋 Найденные команды: {', '.join(command_handlers)}")
    
    print("\n3️⃣ ПРОВЕРКА ФУНКЦИЙ ОБРАБОТЧИКОВ:")
    
    # Ищем async def функции
    handler_functions = re.findall(r'async def (\w+_handler)', code)
    print(f"   ✅ Async функций-обработчиков: {len(handler_functions)}")
    
    for i, handler in enumerate(handler_functions[:10], 1):  # Показываем первые 10
        print(f"      {i:2d}. {handler}")
    
    if len(handler_functions) > 10:
        print(f"      ... и еще {len(handler_functions) - 10}")
    
    print("\n4️⃣ ПРОВЕРКА MAIN ФУНКЦИИ:")
    
    if "async def main():" in code:
        print("   ✅ Функция main() найдена")
        
        if "dp.start_polling(bot)" in code:
            print("   ✅ Polling настроен")
        else:
            print("   ❌ Polling НЕ настроен!")
            
        if "asyncio.run(main())" in code:
            print("   ✅ Запуск asyncio.run(main()) найден")
        else:
            print("   ❌ Запуск asyncio.run(main()) НЕ найден!")
    else:
        print("   ❌ Функция main() НЕ найдена!")
    
    print("\n5️⃣ ПРОВЕРКА ТОКЕНА:")
    
    if 'BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"' in code:
        print("   ⚠️ Токен НЕ заменен на реальный!")
        print("   📝 Замените YOUR_BOT_TOKEN_HERE на токен от @BotFather")
    else:
        print("   ✅ Токен заменен")
    
    print("\n6️⃣ ПРОВЕРКА CALLBACK ОБРАБОТЧИКОВ:")
    
    callback_handlers = re.findall(r'@dp\.callback_query', code)
    print(f"   ✅ Callback обработчиков: {len(callback_handlers)}")
    
    print("\n7️⃣ ВОЗМОЖНЫЕ ПРОБЛЕМЫ И РЕШЕНИЯ:")
    
    problems = []
    
    # Проверяем основные проблемы
    if 'BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"' in code:
        problems.append({
            "problem": "Не заменен токен бота",
            "solution": "Замените YOUR_BOT_TOKEN_HERE на реальный токен от @BotFather"
        })
    
    if "dp.start_polling(bot)" not in code:
        problems.append({
            "problem": "Отсутствует запуск polling",
            "solution": "Добавьте await dp.start_polling(bot) в main функцию"
        })
    
    if len(command_handlers) == 0:
        problems.append({
            "problem": "Команды не найдены в коде",
            "solution": "Проверьте создание команд в редакторе"
        })
    
    if not problems:
        print("   ✅ Основные проблемы не обнаружены!")
        print("\n🎯 РЕКОМЕНДАЦИИ ДЛЯ ОТЛАДКИ:")
        print("   1. Убедитесь, что токен правильный")
        print("   2. Проверьте подключение к интернету") 
        print("   3. Убедитесь, что бот не заблокирован")
        print("   4. Проверьте права бота (может ли получать сообщения)")
        print("   5. Проверьте логи на ошибки запуска")
    else:
        for i, prob in enumerate(problems, 1):
            print(f"   ❌ {i}. {prob['problem']}")
            print(f"      💡 {prob['solution']}")
    
    return {
        "imports_ok": all("✅" in imp for imp in imports_found),
        "handlers_count": len(handler_functions),
        "commands_count": len(command_handlers),
        "has_main": "async def main():" in code,
        "has_polling": "dp.start_polling(bot)" in code,
        "token_replaced": 'BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"' not in code,
        "problems": problems
    }

def check_project_structure():
    """Проверяет структуру проекта в API"""
    
    print("\n🗂️ ПРОВЕРКА СТРУКТУРЫ ПРОЕКТА:")
    
    try:
        # Получаем список проектов
        response = requests.get('http://localhost:5000/api/projects')
        if response.status_code == 200:
            projects = response.json()
            print(f"   ✅ Найдено проектов: {len(projects)}")
            
            for project in projects:
                print(f"   📋 {project['id']}: {project['name']}")
                
                # Проверяем структуру данных проекта
                data = project.get('data', {})
                nodes = data.get('nodes', [])
                connections = data.get('connections', [])
                
                command_nodes = [n for n in nodes if n.get('type') in ['start', 'command']]
                
                print(f"      • Узлов: {len(nodes)}")
                print(f"      • Связей: {len(connections)}")
                print(f"      • Команд: {len(command_nodes)}")
                
                # Показываем команды
                for node in command_nodes:
                    cmd = node.get('data', {}).get('command', 'no_command')
                    print(f"         - {cmd}")
                print()
        else:
            print(f"   ❌ Ошибка получения проектов: {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Ошибка подключения к API: {e}")

def create_minimal_test_bot():
    """Создает минимальный тестовый бот для проверки"""
    
    print("\n🧪 СОЗДАНИЕ МИНИМАЛЬНОГО ТЕСТ-БОТА:")
    
    minimal_bot = '''"""
Минимальный тест-бот для диагностики команд
"""

import asyncio
import logging
from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart, Command

# ЗАМЕНИТЕ НА ВАШ ТОКЕН!
BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"

logging.basicConfig(level=logging.INFO)

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

@dp.message(CommandStart())
async def start_handler(message: types.Message):
    await message.answer("🚀 Стартовая команда работает!")

@dp.message(Command("test"))
async def test_handler(message: types.Message):
    await message.answer("✅ Тестовая команда работает!")

@dp.message(Command("help"))
async def help_handler(message: types.Message):
    await message.answer("❓ Команда помощи работает!")

async def main():
    print("🤖 Запуск минимального тест-бота...")
    print("📝 НЕ ЗАБУДЬТЕ ЗАМЕНИТЬ ТОКЕН!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
'''
    
    with open("minimal_test_bot.py", "w", encoding="utf-8") as f:
        f.write(minimal_bot)
    
    print("   ✅ Создан minimal_test_bot.py")
    print("   📝 Замените токен и запустите: python minimal_test_bot.py")
    print("   🧪 Протестируйте команды: /start, /test, /help")

def main():
    """Основная функция диагностики"""
    
    result = check_bot_code_structure()
    check_project_structure()
    
    print("\n" + "=" * 50)
    print("📊 ИТОГОВАЯ ДИАГНОСТИКА:")
    
    if result["token_replaced"] and result["has_main"] and result["has_polling"]:
        print("✅ Код бота выглядит корректно!")
        print("🔧 Возможные причины проблемы:")
        print("   • Неправильный токен")
        print("   • Проблемы с сетью") 
        print("   • Бот заблокирован пользователем")
        print("   • Команды написаны с ошибками")
    else:
        print("❌ Обнаружены проблемы в коде!")
        if result["problems"]:
            print("🔧 Исправьте найденные проблемы")
    
    create_minimal_test_bot()
    
    print("\n💡 СЛЕДУЮЩИЕ ШАГИ:")
    print("1. Исправьте найденные проблемы")
    print("2. Протестируйте minimal_test_bot.py")
    print("3. Если минимальный бот работает, проблема в основном коде")
    print("4. Если минимальный бот не работает, проблема в токене/настройках")

if __name__ == "__main__":
    main()