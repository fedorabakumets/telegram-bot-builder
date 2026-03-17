/**
 * @fileoverview Тестовые данные для шаблона запуска
 * @module templates/main/main.fixture
 */

import type { MainTemplateParams } from './main.params';

/** Валидные параметры: БД включена */
export const validParamsEnabled: MainTemplateParams = {
  userDatabaseEnabled: true,
  menuCommands: [{ command: 'start', description: 'Запустить бота' }],
};

/** Валидные параметры: БД выключена */
export const validParamsDisabled: MainTemplateParams = {
  userDatabaseEnabled: false,
  menuCommands: [{ command: 'start', description: 'Запустить бота' }],
};

/** Невалидные параметры: неправильный тип */
export const invalidParamsWrongType = {
  userDatabaseEnabled: 'true',
};

/** Невалидные параметры: отсутствует поле */
export const invalidParamsMissingField = {};

/** Ожидаемый вывод: БД включена */
export const expectedOutputEnabled = `
async def set_bot_commands():
    """Настройка меню команд для BotFather"""
    commands = [
        BotCommand(command="start", description="Запустить бота"),
    ]
    await bot.set_my_commands(commands)


async def main():
    """Главная функция запуска бота"""
    global db_pool

    def signal_handler(signum, frame):
        print(f"⚠️ Получен сигнал {signum}, начинаем корректное завершение...")
        import sys
        sys.exit(0)

    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)

    try:
        await init_database()

        await set_bot_commands()

        dp.message.middleware(message_logging_middleware)

        print("🚀 Бот запущен и готов к работе!")
        await dp.start_polling(bot)
    except KeyboardInterrupt:
        print("⚠️ Получен сигнал остановки, завершаем работу...")
    except SystemExit:
        print("⚠️ Системное завершение, завершаем работу...")
    except Exception as e:
        logging.error(f"Ошибка: {e}")
    finally:
        if db_pool:
            await db_pool.close()

        await bot.session.close()


if __name__ == "__main__":
    asyncio.run(main())
`.trim();

/** Ожидаемый вывод: БД выключена */
export const expectedOutputDisabled = `
async def set_bot_commands():
    """Настройка меню команд для BotFather"""
    commands = [
        BotCommand(command="start", description="Запустить бота"),
    ]
    await bot.set_my_commands(commands)


async def main():
    """Главная функция запуска бота"""
    global db_pool

    def signal_handler(signum, frame):
        print(f"⚠️ Получен сигнал {signum}, начинаем корректное завершение...")
        import sys
        sys.exit(0)

    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)

    try:
        await set_bot_commands()

        print("🚀 Бот запущен и готов к работе!")
        await dp.start_polling(bot)
    except KeyboardInterrupt:
        print("⚠️ Получен сигнал остановки, завершаем работу...")
    except SystemExit:
        print("⚠️ Системное завершение, завершаем работу...")
    except Exception as e:
        logging.error(f"Ошибка: {e}")
    finally:
        await bot.session.close()


if __name__ == "__main__":
    asyncio.run(main())
`.trim();
