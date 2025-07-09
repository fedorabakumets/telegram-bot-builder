"""
Тестовый бот для проверки поддержки Markdown форматирования
"""
import asyncio
import logging
import os
from aiogram import Bot, Dispatcher, types
from aiogram.enums import ParseMode
from aiogram.filters import Command
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, ReplyKeyboardMarkup, KeyboardButton, ReplyKeyboardRemove
from aiogram.utils.keyboard import InlineKeyboardBuilder, ReplyKeyboardBuilder

# Настройка логирования
logging.basicConfig(level=logging.INFO)

# Получаем токен бота из переменных окружения
API_TOKEN = "ВАША_ТОЧКА_СЮДА"  # Замените на ваш токен

if not API_TOKEN or API_TOKEN == "ВАША_ТОЧКА_СЮДА":
    print("❌ Ошибка: Не указан токен бота!")
    print("Установите токен в переменной API_TOKEN")
    exit()

# Инициализируем бота и диспетчер
bot = Bot(token=API_TOKEN)
dp = Dispatcher()

async def is_admin(user_id: int) -> bool:
    """Проверяет, является ли пользователь администратором"""
    # Список администраторов (замените на реальные ID)
    admin_list = [123456789]  # Замените на ваш Telegram ID
    return user_id in admin_list

async def is_private_chat(message: types.Message) -> bool:
    """Проверяет, является ли чат приватным"""
    return message.chat.type == "private"

async def check_auth(user_id: int) -> bool:
    """Проверяет авторизацию пользователя"""
    return True  # Для простого теста разрешаем всем

@dp.message(Command("start"))
async def start_handler(message: types.Message):
    """Обработчик команды /start с markdown форматированием"""
    logging.info(f"Команда /start вызвана пользователем {message.from_user.id}")
    
    text = """🤖 **Добро пожаловать в тестовый бот!**

Этот бот проверяет поддержку *markdown* форматирования:

• **Жирный текст**
• *Курсивный текст*  
• `Код в строке`
• [Ссылка](https://example.com)

```python
# Блок кода
print("Hello World!")
```

Выберите действие:"""
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🎯 Тест Inline кнопок", callback_data="test_inline"))
    builder.add(InlineKeyboardButton(text="⌨️ Тест Reply кнопок", callback_data="test_reply"))
    builder.add(InlineKeyboardButton(text="📊 Сложный markdown", callback_data="complex_markdown"))
    keyboard = builder.as_markup()
    
    await message.answer(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "test_inline")
async def test_inline_callback(callback_query: types.CallbackQuery):
    """Тест inline кнопок с markdown"""
    await callback_query.answer()
    
    text = """✅ **Inline кнопки работают!**

*Это сообщение* с `markdown` форматированием отправлено через **inline callback**.

Выберите следующее действие:"""
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 Назад", callback_data="back_to_start"))
    builder.add(InlineKeyboardButton(text="🔗 Тест URL", url="https://telegram.org"))
    keyboard = builder.as_markup()
    
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "test_reply")
async def test_reply_callback(callback_query: types.CallbackQuery):
    """Тест reply кнопок с markdown"""
    await callback_query.answer()
    
    text = """⌨️ **Reply клавиатура активирована!**

Теперь используйте *кнопки ниже* для навигации.

Поддерживается **markdown** форматирование!"""
    
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="👍 Отлично"))
    builder.add(KeyboardButton(text="🔙 Назад к старту"))
    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
    
    try:
        await callback_query.message.delete()
    except:
        pass
    
    await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "complex_markdown")
async def complex_markdown_callback(callback_query: types.CallbackQuery):
    """Демонстрация сложного markdown"""
    await callback_query.answer()
    
    text = """📊 **Сложный пример Markdown**

# Заголовок уровня 1
## Заголовок уровня 2

**Жирный текст** и *курсивный текст*

• Список элементов
• С **жирными** словами  
• И *курсивом*

`Встроенный код` и ссылки: [Telegram](https://telegram.org)

```python
def example():
    return "Блок кода Python"
```

> Цитата с важной информацией

---

*Форматирование работает отлично!*"""
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 Назад к меню", callback_data="back_to_start"))
    keyboard = builder.as_markup()
    
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "back_to_start")
async def back_to_start_callback(callback_query: types.CallbackQuery):
    """Возврат к начальному меню"""
    await callback_query.answer()
    
    text = """🤖 **Добро пожаловать в тестовый бот!**

Этот бот проверяет поддержку *markdown* форматирования:

• **Жирный текст**
• *Курсивный текст*  
• `Код в строке`
• [Ссылка](https://example.com)

```python
# Блок кода
print("Hello World!")
```

Выберите действие:"""
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🎯 Тест Inline кнопок", callback_data="test_inline"))
    builder.add(InlineKeyboardButton(text="⌨️ Тест Reply кнопок", callback_data="test_reply"))
    builder.add(InlineKeyboardButton(text="📊 Сложный markdown", callback_data="complex_markdown"))
    keyboard = builder.as_markup()
    
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.message(lambda message: message.text == "👍 Отлично")
async def excellent_reply_handler(message: types.Message):
    """Обработчик reply кнопки 'Отлично'"""
    text = """👍 **Отлично! Reply кнопки работают!**

*Markdown* форматирование работает и с **reply кнопками**.

Выберите действие:"""
    
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🔙 Назад к старту"))
    builder.add(KeyboardButton(text="📱 Контакт"))
    builder.add(KeyboardButton(text="📍 Локация"))
    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
    
    await message.answer(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.message(lambda message: message.text == "🔙 Назад к старту")
async def back_to_start_reply_handler(message: types.Message):
    """Обработчик reply кнопки 'Назад к старту'"""
    text = """🤖 **Добро пожаловать в тестовый бот!**

Этот бот проверяет поддержку *markdown* форматирования:

• **Жирный текст**
• *Курсивный текст*  
• `Код в строке`
• [Ссылка](https://example.com)

```python
# Блок кода
print("Hello World!")
```

Выберите действие:"""
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🎯 Тест Inline кнопок", callback_data="test_inline"))
    builder.add(InlineKeyboardButton(text="⌨️ Тест Reply кнопок", callback_data="test_reply"))
    builder.add(InlineKeyboardButton(text="📊 Сложный markdown", callback_data="complex_markdown"))
    keyboard = builder.as_markup()
    
    await message.answer(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

async def main():
    """Главная функция для запуска бота"""
    try:
        print("🤖 Тестовый Markdown бот запущен!")
        await dp.start_polling(bot)
    except Exception as e:
        print(f"❌ Ошибка при запуске бота: {e}")
    finally:
        await bot.session.close()

if __name__ == '__main__':
    asyncio.run(main())