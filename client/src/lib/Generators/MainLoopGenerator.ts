/**
 * MainLoopGenerator - Генератор основного цикла бота
 * 
 * Отвечает за генерацию:
 * - Функции main()
 * - Запуска бота
 * - Остановки бота
 * - Обработки сигналов
 * - Регистрации middleware
 */

import { IMainLoopGenerator, GenerationContext } from '../Core/types';
import { hasInlineButtons } from '../has';

export class MainLoopGenerator implements IMainLoopGenerator {
    /**
     * Генерирует основную функцию main()
     */
    generateMainFunction(context: GenerationContext): string {
        const { userDatabaseEnabled, nodes } = context;

        let code = '';

        // Начало функции main()
        code += '\n\n# Запуск бота\n';
        code += 'async def main():\n';

        if (userDatabaseEnabled) {
            code += '    global db_pool\n';
        }

        code += '    \n';

        // Обработчик сигналов
        code += this.generateSignalHandlers();

        // Основной блок try-except
        code += '    try:\n';

        // Инициализация
        code += this.generateInitialization(context);

        // Регистрация middleware
        code += this.generateMiddlewareRegistration(context);

        // Запуск бота
        code += this.generateBotStartup(context);

        // Обработка исключений
        code += this.generateExceptionHandling();

        // Блок finally для очистки
        code += this.generateBotShutdown(context);

        return code;
    }

    /**
     * Генерирует код запуска бота
     */
    generateBotStartup(context: GenerationContext): string {
        let code = '';

        // Добавляем функцию on_startup для совместимости с тестами
        code += '        # Регистрируем startup функцию\n';
        code += '        dp.startup.register(on_startup)\n';
        code += '        \n';
        code += '        print("🤖 Бот запущен и готов к работе!")\n';
        code += '        await dp.start_polling(bot)\n';

        return code;
    }

    /**
     * Генерирует код остановки бота
     */
    generateBotShutdown(context: GenerationContext): string {
        const { userDatabaseEnabled } = context;

        let code = '';

        code += '    finally:\n';
        code += '        # Правильно закрываем все соединения\n';

        if (userDatabaseEnabled) {
            code += '        if db_pool:\n';
            code += '            await db_pool.close()\n';
            code += '            print("🔌 Соединение с базой данных закрыто")\n';
        }

        code += '        \n';
        code += '        # Закрываем сессию бота\n';
        code += '        await bot.session.close()\n';
        code += '        print("🔌 Сессия бота закрыта")\n';
        code += '        print("✅ Бот корректно завершил работу")\n\n';

        return code;
    }

    /**
     * Генерирует обработчики сигналов для корректного завершения
     */
    private generateSignalHandlers(): string {
        let code = '';

        code += '    # Обработчик сигналов для корректного завершения\n';
        code += '    def signal_handler(signum, frame):\n';
        code += '        print(f"🛑 Получен сигнал {signum}, начинаем корректное завершение...")\n';
        code += '        raise KeyboardInterrupt()\n';
        code += '    \n';
        code += '    # Регистрируем обработчики сигналов\n';
        code += '    signal.signal(signal.SIGTERM, signal_handler)\n';
        code += '    signal.signal(signal.SIGINT, signal_handler)\n';
        code += '    \n';

        return code;
    }

    /**
     * Генерирует код инициализации (база данных, команды)
     */
    private generateInitialization(context: GenerationContext): string {
        const { userDatabaseEnabled } = context;

        let code = '';

        if (userDatabaseEnabled) {
            code += '        # Инициализируем базу данных\n';
            code += '        await init_database()\n';
        }

        // Проверяем наличие команд меню (это нужно будет получить из контекста)
        // Пока добавим условную проверку
        code += '        # Устанавливаем команды бота (если есть)\n';
        code += '        # await set_bot_commands()  # Раскомментируйте если есть команды меню\n';
        code += '        \n';

        return code;
    }

    /**
     * Генерирует регистрацию middleware
     */
    private generateMiddlewareRegistration(context: GenerationContext): string {
        const { userDatabaseEnabled, nodes } = context;

        let code = '';

        if (userDatabaseEnabled) {
            code += '        # Регистрация middleware для сохранения сообщений\n';
            code += '        dp.message.middleware(message_logging_middleware)\n';

            // Регистрируем callback_query middleware только если в боте есть inline кнопки
            if (hasInlineButtons(nodes || [])) {
                code += '        dp.callback_query.middleware(callback_query_logging_middleware)\n';
            }

            code += '        \n';
        }

        return code;
    }

    /**
     * Генерирует обработку исключений
     */
    private generateExceptionHandling(): string {
        let code = '';

        code += '    except KeyboardInterrupt:\n';
        code += '        print("🛑 Получен сигнал остановки, завершаем работу...")\n';
        code += '    except SystemExit:\n';
        code += '        print("🛑 Системное завершение, завершаем работу...")\n';
        code += '    except Exception as e:\n';
        code += '        logging.error(f"Критическая ошибка: {e}")\n';

        return code;
    }

    /**
     * Генерирует точку входа в программу
     */
    generateEntryPoint(): string {
        let code = '';

        code += 'if __name__ == "__main__":\n';
        code += '    asyncio.run(main())\n';

        return code;
    }
}