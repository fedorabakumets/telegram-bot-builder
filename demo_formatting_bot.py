#!/usr/bin/env python3
"""
Демонстрационный бот для тестирования форматирования
"""

import asyncio
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.utils.keyboard import InlineKeyboardBuilder
from aiogram.enums import ParseMode

# Замените на ваш токен
BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

@dp.message(CommandStart())
async def start_handler(message: types.Message):
    """Тестируем различные типы форматирования"""
    
    # Markdown форматирование
    markdown_text = """🏛️ **ДОБРО ПОЖАЛОВАТЬ В УЛЬТРА-КОМПЛЕКСНЫЙ ПОЛИТИКО-ИСТОРИЧЕСКИЙ ОПРОС!**

📚 Этот опрос включает:
• 🗳️ **Политические взгляды** (20+ вопросов)
• 📜 **Историческое знание** (25+ вопросов)
• 🤔 **Философские воззрения** (15+ вопросов)
• 🌍 **Социологический анализ** (20+ вопросов)

⏱️ **Время прохождения:** 45-60 минут
🎯 **Результат:** Подробный анализ ваших взглядов

**Готовы начать глубокое исследование?**"""
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="✅ Markdown тест", callback_data="markdown"))
    builder.add(InlineKeyboardButton(text="🔧 HTML тест", callback_data="html"))
    keyboard = builder.as_markup()
    
    await message.answer(markdown_text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "markdown")
async def handle_markdown_test(callback_query: types.CallbackQuery):
    await callback_query.answer()
    
    markdown_text = """✅ **MARKDOWN ТЕСТ УСПЕШЕН!**

*Курсив работает*
**Жирный работает**
__Подчеркнутый работает__
~~Зачеркнутый работает~~
`Код работает`

> Цитата работает

# Заголовок работает"""
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 Назад", callback_data="back"))
    keyboard = builder.as_markup()
    
    await callback_query.message.edit_text(markdown_text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "html")
async def handle_html_test(callback_query: types.CallbackQuery):
    await callback_query.answer()
    
    html_text = """🔧 <b>HTML ТЕСТ УСПЕШЕН!</b>

<i>Курсив работает</i>
<b>Жирный работает</b>
<u>Подчеркнутый работает</u>
<s>Зачеркнутый работает</s>
<code>Код работает</code>

<blockquote>Цитата работает</blockquote>"""
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 Назад", callback_data="back"))
    keyboard = builder.as_markup()
    
    await callback_query.message.edit_text(html_text, reply_markup=keyboard, parse_mode=ParseMode.HTML)

@dp.callback_query(lambda c: c.data == "back")
async def handle_back(callback_query: types.CallbackQuery):
    await callback_query.answer()
    
    # Возвращаемся к исходному сообщению
    markdown_text = """🏛️ **ДОБРО ПОЖАЛОВАТЬ В УЛЬТРА-КОМПЛЕКСНЫЙ ПОЛИТИКО-ИСТОРИЧЕСКИЙ ОПРОС!**

📚 Этот опрос включает:
• 🗳️ **Политические взгляды** (20+ вопросов)
• 📜 **Историческое знание** (25+ вопросов)
• 🤔 **Философские воззрения** (15+ вопросов)
• 🌍 **Социологический анализ** (20+ вопросов)

⏱️ **Время прохождения:** 45-60 минут
🎯 **Результат:** Подробный анализ ваших взглядов

**Готовы начать глубокое исследование?**"""
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="✅ Markdown тест", callback_data="markdown"))
    builder.add(InlineKeyboardButton(text="🔧 HTML тест", callback_data="html"))
    keyboard = builder.as_markup()
    
    await callback_query.message.edit_text(markdown_text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

async def main():
    """Запуск бота"""
    print("Бот запущен!")
    print("Проверьте форматирование - жирный текст должен отображаться правильно")
    print("Если проблема существует, она может быть в:")
    print("1. Неправильном токене бота")
    print("2. Устаревшем клиенте Telegram")
    print("3. Проблемах с кодировкой")
    
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())