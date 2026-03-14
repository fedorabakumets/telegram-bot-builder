/**
 * @fileoverview Обработчики сигналов и polling цикл
 * Функции для генерации основного цикла бота и обработки сигналов
 */

/**
 * Генерирует код инициализации бота и настройки middleware
 * @param userDatabaseEnabled - Включена ли база данных пользователей
 * @param menuCommandsLength - Количество команд меню
 * @param hasInlineButtonsResult - Есть ли inline кнопки
 * @returns {string} Python код инициализации
 */
export const generateBotInitialization = (
  userDatabaseEnabled: boolean,
  menuCommandsLength: number,
  hasInlineButtonsResult: boolean
): string => {
  let code = '';
  
  if (userDatabaseEnabled) {
    code += '        # Инициализируем базу данных\n';
    code += '        await init_database()\n';
  }
  
  if (menuCommandsLength > 0) {
    code += '        await set_bot_commands()\n';
  }
  
  code += '        \n';
  
  if (userDatabaseEnabled) {
    code += '        # Регистрация middleware для сохранения сообщений\n';
    code += '        dp.message.middleware(message_logging_middleware)\n';
    
    if (hasInlineButtonsResult) {
      code += '        dp.callback_query.middleware(callback_query_logging_middleware)\n';
    }
    
    code += '        \n';
  }
  
  return code;
};

/**
 * Генерирует обработчик сигналов для корректного завершения
 * @returns {string} Python код обработчика сигналов
 */
export const generateSignalHandler = (): string => {
  let code = '\n\n# Запуск бота\n';
  code += 'async def main():\n';
  code += '    global db_pool\n';
  code += '    \n';
  code += '    # Обработчик сигналов для корректного завершения\n';
  code += '    def signal_handler(signum, frame):\n';
  code += '        print(f"⚠️ Получен сигнал {signum}, начинаем корректное завершение...")\n';
  code += '        import sys\n';
  code += '        sys.exit(0)\n';
  code += '    \n';
  code += '    # Регистрируем обработчики сигналов\n';
  code += '    signal.signal(signal.SIGTERM, signal_handler)\n';
  code += '    signal.signal(signal.SIGINT, signal_handler)\n';
  code += '    \n';
  code += '    try:\n';
  return code;
};

/**
 * Генерирует основной цикл опроса с корректным завершением работы
 * @param userDatabaseEnabled - Включена ли база данных пользователей
 * @returns {string} Python код polling цикла
 */
export const generatePollingLoop = (userDatabaseEnabled: boolean): string => {
  let code = '        print("🚀 Бот запущен и готов к работе!")\n';
  code += '        await dp.start_polling(bot)\n';
  code += '    except KeyboardInterrupt:\n';
  code += '        print("⚠️ Получен сигнал остановки, завершаем работу...")\n';
  code += '    except SystemExit:\n';
  code += '        print("⚠️ Системное завершение, завершаем работу...")\n';
  code += '    except Exception as e:\n';
  code += '        logging.error(f"Ошибка: {e}")\n';
  code += '    finally:\n';
  code += '        # Закрытие соединений при выходе\n';
  
  if (userDatabaseEnabled) {
    code += '        if db_pool:\n';
    code += '            await db_pool.close()\n';
  }
  
  code += '        \n';
  code += '        # Закрываем сессию бота\n';
  code += '        await bot.session.close()\n';
  code += '\n';
  
  return code;
};
