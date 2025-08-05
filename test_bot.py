#!/usr/bin/env python3
"""
Тест для проверки функциональности удаления reply клавиатур
"""
import asyncio
import logging
from aiogram import Bot, types
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode

# Настройка логирования
logging.basicConfig(level=logging.INFO)

# Токен бота
BOT_TOKEN = "7552080497:AAEJFmsxmY8PnDzgoUpM5NDg5E1ehNYAHYU"

# ID чата для тестирования (замените на ваш)
TEST_CHAT_ID = 5387239071  # Ваш Telegram ID

async def test_bot_functionality():
    """Тестирует функциональность бота"""
    bot = Bot(token=BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    
    try:
        # Получаем информацию о боте
        bot_info = await bot.get_me()
        print(f"✅ Бот подключен: @{bot_info.username}")
        
        # Тест 1: Отправляем команду /start
        print("\n🔄 Тест 1: Отправка команды /start")
        await bot.send_message(
            chat_id=TEST_CHAT_ID,
            text="/start"
        )
        print("✅ Команда /start отправлена")
        
        # Ждем 2 секунды
        await asyncio.sleep(2)
        
        # Тест 2: Отправляем обычное сообщение (должно удалить reply клавиатуру)
        print("\n🔄 Тест 2: Отправка обычного сообщения")
        await bot.send_message(
            chat_id=TEST_CHAT_ID,
            text="Привет! Это тестовое сообщение"
        )
        print("✅ Обычное сообщение отправлено")
        
        # Ждем 2 секунды
        await asyncio.sleep(2)
        
        # Тест 3: Проверяем, что reply клавиатура удалена
        print("\n🔄 Тест 3: Проверка удаления reply клавиатуры")
        await bot.send_message(
            chat_id=TEST_CHAT_ID,
            text="🎉 <b>Тестирование завершено!</b>\n\n"
                 "Проверьте в чате:\n"
                 "1. После /start должны были появиться reply кнопки\n"
                 "2. После обычного сообщения кнопки должны исчезнуть\n"
                 "3. Это сообщение должно отображаться без кнопок"
        )
        print("✅ Проверочное сообщение отправлено")
        
    except Exception as e:
        print(f"❌ Ошибка при тестировании: {e}")
        
    finally:
        await bot.session.close()

async def check_bot_status():
    """Проверяет статус бота через API"""
    import aiohttp
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get('http://localhost:5000/api/projects/1/bot') as response:
                if response.status == 200:
                    data = await response.json()
                    if data['status'] == 'running':
                        print("✅ Бот работает на сервере")
                        return True
                    else:
                        print(f"❌ Бот не работает: {data['status']}")
                        return False
                else:
                    print(f"❌ Ошибка API: {response.status}")
                    return False
        except Exception as e:
            print(f"❌ Ошибка подключения к API: {e}")
            return False

async def main():
    """Основная функция тестирования"""
    print("🚀 Начинаем тестирование бота...")
    
    # Проверяем статус бота
    if not await check_bot_status():
        print("❌ Бот не запущен. Запустите бота перед тестированием.")
        return
    
    # Запускаем тесты
    await test_bot_functionality()
    
    print("\n✅ Тестирование завершено! Проверьте результаты в Telegram.")

if __name__ == "__main__":
    asyncio.run(main())