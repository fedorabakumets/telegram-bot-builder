# Bots

Папка с сгенерированными Telegram ботами и их резервными копиями.

## Структура

### Сгенерированные боты
Каждый бот представлен Python файлом с уникальным именем:
- `bot_1_1.py` - бот версии 1.1
- `bot_1_2.py` - бот версии 1.2
- `bot_1_3.py` - бот версии 1.3
- `bot_1_4.py` - бот версии 1.4
- `bot_3_6.py` - бот версии 3.6
- `bot_4_5.py` - бот версии 4.5

### Тестовые боты
- `bot_test_2026-01-25T10-58-00.py` - тестовый бот с временной меткой
- `bot_test_2026-01-25T10-58-50.py` - тестовый бот с временной меткой
- `bot_test_2026-01-25T11-03-21.py` - тестовый бот с временной меткой

### Резервные копии
Для каждого бота создаются резервные копии с различными суффиксами:
- `.backup` - основная резервная копия
- `.formatting.backup` - копия до форматирования
- `.improved.backup` - копия до улучшений

### Скомпилированные файлы
- `__pycache__/` - папка с скомпилированными Python файлами (.pyc)

## Формат файлов ботов

Каждый сгенерированный бот содержит:

### Основная структура
```python
import asyncio
from telegram import Update, Bot
from telegram.ext import Application, CommandHandler, MessageHandler, filters

# Конфигурация бота
BOT_TOKEN = "YOUR_BOT_TOKEN"
BOT_USERNAME = "your_bot_username"

# Обработчики команд
async def start_command(update: Update, context):
    # Логика команды /start
    pass

async def help_command(update: Update, context):
    # Логика команды /help
    pass

# Обработчики сообщений
async def handle_message(update: Update, context):
    # Логика обработки сообщений
    pass

# Главная функция
def main():
    app = Application.builder().token(BOT_TOKEN).build()
    
    # Регистрация обработчиков
    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(MessageHandler(filters.TEXT, handle_message))
    
    # Запуск бота
    app.run_polling()

if __name__ == "__main__":
    main()
```

## Особенности генерации

### Автоматическое именование
- Боты именуются по шаблону `bot_{version}_{subversion}.py`
- Тестовые боты включают временную метку в формате ISO

### Система резервного копирования
- Перед каждым изменением создается резервная копия
- Копии сохраняются с описательными суффиксами
- Позволяет откатиться к предыдущим версиям

### Компиляция
- Python автоматически создает .pyc файлы при выполнении
- Файлы кэшируются в папке `__pycache__/`

## Использование

### Запуск бота
```bash
cd bots
python bot_4_5.py
```

### Установка зависимостей
```bash
pip install python-telegram-bot
```

### Настройка токена
1. Получите токен от @BotFather в Telegram
2. Замените `YOUR_BOT_TOKEN` в файле бота на ваш токен
3. Замените `your_bot_username` на имя вашего бота

## Безопасность

⚠️ **Важно**: Никогда не коммитьте файлы ботов с реальными токенами в публичные репозитории!