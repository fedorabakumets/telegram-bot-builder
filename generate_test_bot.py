"""
Генератор тестового бота для проверки проблемы с командами и инлайн кнопками
"""
import json
import sys
import os

# Добавляем путь к клиентской части для импорта генератора
sys.path.append(os.path.join(os.path.dirname(__file__), 'client', 'src', 'lib'))

def load_test_bot():
    """Загружает тестовый бот из JSON файла"""
    try:
        with open('test_command_issue_bot.json', 'r', encoding='utf-8') as f:
            bot_data = json.load(f)
        return bot_data
    except FileNotFoundError:
        print("❌ Файл test_command_issue_bot.json не найден. Запустите test_command_issue.py сначала.")
        return None

def manual_generate_python_code(bot_data):
    """Генерирует Python код вручную для тестирования"""
    nodes = bot_data['nodes']
    
    code = '"""\n'
    code += 'Тест команд с инлайн кнопками - Telegram Bot\n'
    code += 'Сгенерировано для тестирования проблемы с командами\n'
    code += '"""\n\n'
    
    code += 'import asyncio\n'
    code += 'import logging\n'
    code += 'from aiogram import Bot, Dispatcher, types, F\n'
    code += 'from aiogram.filters import CommandStart, Command\n'
    code += 'from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton, BotCommand, ReplyKeyboardRemove\n'
    code += 'from aiogram.utils.keyboard import ReplyKeyboardBuilder, InlineKeyboardBuilder\n'
    code += 'from aiogram.enums import ParseMode\n\n'
    
    code += '# Токен вашего бота (получите у @BotFather)\n'
    code += 'BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"\n\n'
    
    code += '# Настройка логирования\n'
    code += 'logging.basicConfig(level=logging.INFO)\n\n'
    
    code += '# Создание бота и диспетчера\n'
    code += 'bot = Bot(token=BOT_TOKEN)\n'
    code += 'dp = Dispatcher()\n\n'
    
    code += '# Список администраторов\n'
    code += 'ADMIN_IDS = [123456789]\n\n'
    
    code += '# Хранилище пользователей\n'
    code += 'user_data = {}\n\n'
    
    code += '# Утилитарные функции\n'
    code += 'async def is_admin(user_id: int) -> bool:\n'
    code += '    return user_id in ADMIN_IDS\n\n'
    
    code += 'async def is_private_chat(message: types.Message) -> bool:\n'
    code += '    return message.chat.type == "private"\n\n'
    
    code += 'async def check_auth(user_id: int) -> bool:\n'
    code += '    return user_id in user_data\n\n'
    
    # Команда /start
    code += '@dp.message(CommandStart())\n'
    code += 'async def start_handler(message: types.Message):\n'
    code += '    user_data[message.from_user.id] = {\n'
    code += '        "username": message.from_user.username,\n'
    code += '        "first_name": message.from_user.first_name,\n'
    code += '        "last_name": message.from_user.last_name,\n'
    code += '        "registered_at": message.date\n'
    code += '    }\n\n'
    code += '    text = """🎉 Добро пожаловать!\n\nЭто тестовый бот для проверки команд с инлайн кнопками.\n\nПопробуйте написать \'помощь\' или \'старт\' как обычное сообщение."""\n'
    code += '    \n'
    code += '    # Создаем inline клавиатуру с кнопками\n'
    code += '    builder = InlineKeyboardBuilder()\n'
    code += '    builder.add(InlineKeyboardButton(text="📋 Помощь", callback_data="help-cmd"))\n'
    code += '    builder.add(InlineKeyboardButton(text="📱 Меню", callback_data="menu-msg"))\n'
    code += '    keyboard = builder.as_markup()\n'
    code += '    # Отправляем сообщение с прикрепленными inline кнопками\n'
    code += '    await message.answer(text, reply_markup=keyboard)\n\n'
    
    # Команда /help
    code += '@dp.message(Command("help"))\n'
    code += 'async def help_handler(message: types.Message):\n'
    code += '    text = """❓ Справка по командам:\n\n/start - Запуск бота\n/help - Эта справка\n/menu - Главное меню\n\nВы также можете писать команды словами: \'помощь\', \'старт\', \'меню\'"""\n'
    code += '    \n'
    code += '    # Создаем inline клавиатуру с кнопками\n'
    code += '    builder = InlineKeyboardBuilder()\n'
    code += '    builder.add(InlineKeyboardButton(text="📋 Все команды", callback_data="commands-msg"))\n'
    code += '    builder.add(InlineKeyboardButton(text="🔙 На главную", callback_data="start-node"))\n'
    code += '    keyboard = builder.as_markup()\n'
    code += '    # Отправляем сообщение с прикрепленными inline кнопками\n'
    code += '    await message.answer(text, reply_markup=keyboard)\n\n'
    
    # Обработчики синонимов
    code += '# Обработчики синонимов команд\n'
    code += '@dp.message(lambda message: message.text and message.text.lower() == "старт")\n'
    code += 'async def start_synonym_старт_handler(message: types.Message):\n'
    code += '    await start_handler(message)\n\n'
    
    code += '@dp.message(lambda message: message.text and message.text.lower() == "начать")\n'
    code += 'async def start_synonym_начать_handler(message: types.Message):\n'
    code += '    await start_handler(message)\n\n'
    
    code += '@dp.message(lambda message: message.text and message.text.lower() == "привет")\n'
    code += 'async def start_synonym_привет_handler(message: types.Message):\n'
    code += '    await start_handler(message)\n\n'
    
    code += '@dp.message(lambda message: message.text and message.text.lower() == "помощь")\n'
    code += 'async def help_synonym_помощь_handler(message: types.Message):\n'
    code += '    await help_handler(message)\n\n'
    
    code += '@dp.message(lambda message: message.text and message.text.lower() == "справка")\n'
    code += 'async def help_synonym_справка_handler(message: types.Message):\n'
    code += '    await help_handler(message)\n\n'
    
    code += '@dp.message(lambda message: message.text and message.text.lower() == "команды")\n'
    code += 'async def help_synonym_команды_handler(message: types.Message):\n'
    code += '    await help_handler(message)\n\n'
    
    # Обработчики callback кнопок
    code += '# Обработчики inline кнопок\n'
    code += '@dp.callback_query(lambda c: c.data == "help-cmd")\n'
    code += 'async def handle_callback_help_cmd(callback_query: types.CallbackQuery):\n'
    code += '    await callback_query.answer()\n'
    code += '    text = """❓ Справка по командам:\n\n/start - Запуск бота\n/help - Эта справка\n/menu - Главное меню\n\nВы также можете писать команды словами: \'помощь\', \'старт\', \'меню\'"""\n'
    code += '    builder = InlineKeyboardBuilder()\n'
    code += '    builder.add(InlineKeyboardButton(text="📋 Все команды", callback_data="commands-msg"))\n'
    code += '    builder.add(InlineKeyboardButton(text="🔙 На главную", callback_data="start-node"))\n'
    code += '    keyboard = builder.as_markup()\n'
    code += '    await callback_query.message.edit_text(text, reply_markup=keyboard)\n\n'
    
    code += '@dp.callback_query(lambda c: c.data == "menu-msg")\n'
    code += 'async def handle_callback_menu_msg(callback_query: types.CallbackQuery):\n'
    code += '    await callback_query.answer()\n'
    code += '    text = """📱 Главное меню:\n\nВыберите нужный раздел:"""\n'
    code += '    builder = InlineKeyboardBuilder()\n'
    code += '    builder.add(InlineKeyboardButton(text="ℹ️ Информация", callback_data="info-msg"))\n'
    code += '    builder.add(InlineKeyboardButton(text="⚙️ Настройки", callback_data="settings-msg"))\n'
    code += '    builder.add(InlineKeyboardButton(text="🔙 На главную", callback_data="start-node"))\n'
    code += '    keyboard = builder.as_markup()\n'
    code += '    await callback_query.message.edit_text(text, reply_markup=keyboard)\n\n'
    
    code += '@dp.callback_query(lambda c: c.data == "start-node")\n'
    code += 'async def handle_callback_start_node(callback_query: types.CallbackQuery):\n'
    code += '    await callback_query.answer()\n'
    code += '    text = """🎉 Добро пожаловать!\n\nЭто тестовый бот для проверки команд с инлайн кнопками.\n\nПопробуйте написать \'помощь\' или \'старт\' как обычное сообщение."""\n'
    code += '    builder = InlineKeyboardBuilder()\n'
    code += '    builder.add(InlineKeyboardButton(text="📋 Помощь", callback_data="help-cmd"))\n'
    code += '    builder.add(InlineKeyboardButton(text="📱 Меню", callback_data="menu-msg"))\n'
    code += '    keyboard = builder.as_markup()\n'
    code += '    await callback_query.message.edit_text(text, reply_markup=keyboard)\n\n'
    
    code += '@dp.callback_query(lambda c: c.data == "commands-msg")\n'
    code += 'async def handle_callback_commands_msg(callback_query: types.CallbackQuery):\n'
    code += '    await callback_query.answer()\n'
    code += '    text = """📋 Список всех команд:\n\n🔸 /start (или \'старт\') - Запуск бота\n🔸 /help (или \'помощь\') - Справка\n🔸 /menu (или \'меню\') - Главное меню\n\nВы можете использовать как команды со слешем, так и обычные слова!"""\n'
    code += '    builder = InlineKeyboardBuilder()\n'
    code += '    builder.add(InlineKeyboardButton(text="🧪 Тестировать команды", callback_data="test-msg"))\n'
    code += '    builder.add(InlineKeyboardButton(text="🔙 К справке", callback_data="help-cmd"))\n'
    code += '    keyboard = builder.as_markup()\n'
    code += '    await callback_query.message.edit_text(text, reply_markup=keyboard)\n\n'
    
    code += '@dp.callback_query(lambda c: c.data == "test-msg")\n'
    code += 'async def handle_callback_test_msg(callback_query: types.CallbackQuery):\n'
    code += '    await callback_query.answer()\n'
    code += '    text = """🧪 Тестирование команд:\n\nПопробуйте написать эти слова как обычные сообщения:\n\n• старт\n• помощь\n• справка\n• команды\n• меню\n\nЕсли они не работают, значит проблема в обработке синонимов команд с инлайн кнопками!"""\n'
    code += '    builder = InlineKeyboardBuilder()\n'
    code += '    builder.add(InlineKeyboardButton(text="🔙 К командам", callback_data="commands-msg"))\n'
    code += '    keyboard = builder.as_markup()\n'
    code += '    await callback_query.message.edit_text(text, reply_markup=keyboard)\n\n'
    
    code += '@dp.callback_query(lambda c: c.data == "info-msg")\n'
    code += 'async def handle_callback_info_msg(callback_query: types.CallbackQuery):\n'
    code += '    await callback_query.answer()\n'
    code += '    text = """ℹ️ Информация:\n\nЭто тестовый бот для проверки работы команд с инлайн кнопками.\n\nПроблема: когда команда содержит инлайн кнопки, синонимы команд могут не работать правильно."""\n'
    code += '    builder = InlineKeyboardBuilder()\n'
    code += '    builder.add(InlineKeyboardButton(text="🔙 К меню", callback_data="menu-msg"))\n'
    code += '    keyboard = builder.as_markup()\n'
    code += '    await callback_query.message.edit_text(text, reply_markup=keyboard)\n\n'
    
    code += '@dp.callback_query(lambda c: c.data == "settings-msg")\n'
    code += 'async def handle_callback_settings_msg(callback_query: types.CallbackQuery):\n'
    code += '    await callback_query.answer()\n'
    code += '    text = """⚙️ Настройки:\n\nЗдесь могут быть настройки бота.\n\nВы можете вернуться в главное меню или попробовать написать \'старт\' для возврата на главную."""\n'
    code += '    builder = InlineKeyboardBuilder()\n'
    code += '    builder.add(InlineKeyboardButton(text="🔙 К меню", callback_data="menu-msg"))\n'
    code += '    keyboard = builder.as_markup()\n'
    code += '    await callback_query.message.edit_text(text, reply_markup=keyboard)\n\n'
    
    # Запуск бота
    code += '# Запуск бота\n'
    code += 'async def main():\n'
    code += '    print("Бот запущен!")\n'
    code += '    await dp.start_polling(bot)\n\n'
    
    code += 'if __name__ == "__main__":\n'
    code += '    asyncio.run(main())\n'
    
    return code

def main():
    """Основная функция генерации тестового бота"""
    print("🔧 Генерация Python кода для тестового бота...")
    
    # Загружаем данные бота
    bot_data = load_test_bot()
    if not bot_data:
        return
    
    # Генерируем код
    python_code = manual_generate_python_code(bot_data)
    
    # Сохраняем в файл
    with open('test_command_inline_bot.py', 'w', encoding='utf-8') as f:
        f.write(python_code)
    
    print("✅ Создан файл test_command_inline_bot.py")
    print("\n🎯 Тестирование:")
    print("1. Замените YOUR_BOT_TOKEN_HERE на настоящий токен")
    print("2. Запустите бота")
    print("3. Проверьте:")
    print("   - Работает ли команда /start с инлайн кнопками")
    print("   - Работает ли команда /help с инлайн кнопками")
    print("   - Работают ли синонимы: 'старт', 'помощь', 'справка', 'команды'")
    print("   - Отправляются ли инлайн кнопки при использовании синонимов")
    
    print("\n💡 Ожидаемая проблема:")
    print("Команды /start и /help с инлайн кнопками работают,")
    print("но синонимы могут не отправлять инлайн кнопки в ответ.")

if __name__ == "__main__":
    main()