"""
Тест форматирования текста - Telegram Bot
Сгенерировано с помощью TelegramBot Builder
"""

import asyncio
import logging
from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.utils.keyboard import InlineKeyboardBuilder
from aiogram.enums import ParseMode

# Токен бота для тестирования
BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"

# Настройка логирования
logging.basicConfig(level=logging.INFO)

# Создание бота и диспетчера
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

@dp.message(CommandStart())
async def start_handler(message: types.Message):
    """Тестируем различные виды форматирования"""
    
    # Тест с markdown форматированием
    text = """🤖 **Тест форматирования**

**Жирный текст** должен быть жирным
*Курсивный текст* должен быть наклонным  
`Код` должен быть моноширинным
__Подчеркнутый__ должен быть подчеркнутым
~~Зачеркнутый~~ должен быть зачеркнутым

# Заголовок
## Подзаголовок

> Цитата

Список:
• Пункт 1
• **Пункт 2 жирный**
• *Пункт 3 курсив*

[Ссылка](https://telegram.org)"""
    
    # Создаем inline клавиатуру
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="✅ HTML форматирование", callback_data="test_html"))
    builder.add(InlineKeyboardButton(text="📝 Обычный текст", callback_data="test_plain"))
    keyboard = builder.as_markup()
    
    # Отправляем с Markdown форматированием
    await message.answer(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "test_html")
async def test_html_callback(callback_query: types.CallbackQuery):
    """Тестируем HTML форматирование"""
    await callback_query.answer()
    
    text = """🌟 <b>HTML Форматирование</b>

<b>Жирный текст</b> в HTML
<i>Курсивный текст</i> в HTML
<code>Код</code> в HTML  
<u>Подчеркнутый</u> в HTML
<s>Зачеркнутый</s> в HTML

<pre>Блок кода
  с отступами</pre>

<a href="https://telegram.org">Ссылка в HTML</a>"""
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 Назад к Markdown", callback_data="test_markdown"))
    keyboard = builder.as_markup()
    
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.HTML)

@dp.callback_query(lambda c: c.data == "test_markdown")
async def test_markdown_callback(callback_query: types.CallbackQuery):
    """Возвращаемся к Markdown"""
    await callback_query.answer()
    
    text = """🤖 **Возвращение к Markdown**

**Жирный** и *курсивный* текст
`Код в строке`

```python
def hello():
    print("Hello World!")
```

**Все работает!**"""
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🌟 HTML снова", callback_data="test_html"))
    builder.add(InlineKeyboardButton(text="📱 Обычный текст", callback_data="test_plain"))
    keyboard = builder.as_markup()
    
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "test_plain")
async def test_plain_callback(callback_query: types.CallbackQuery):
    """Тестируем обычный текст без форматирования"""
    await callback_query.answer()
    
    text = """Обычный текст без форматирования

**Это должно отображаться как есть**
*Это тоже*
<b>И это</b>

Никакого форматирования не применяется."""
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 Вернуться к тестам", callback_data="test_markdown"))
    keyboard = builder.as_markup()
    
    # Отправляем без parse_mode
    await callback_query.message.edit_text(text, reply_markup=keyboard)

async def main():
    """Запуск бота"""
    print("🤖 Тестовый бот форматирования запущен!")
    try:
        await dp.start_polling(bot)
    except KeyboardInterrupt:
        print("Бот остановлен")
    finally:
        await bot.session.close()

if __name__ == "__main__":
    asyncio.run(main())