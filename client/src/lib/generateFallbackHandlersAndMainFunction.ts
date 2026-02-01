import { hasInlineButtons } from './has';

/**
 * Генерирует универсальные fallback-обработчики и основную функцию запуска бота
 */
export function generateFallbackHandlersAndMainFunction(
  userDatabaseEnabled: boolean,
  menuCommands: any[],
  nodes: any[]): string {
  let code = '';

  // Добавляем универсальный fallback-обработчик для всех текстовых сообщений
  // Этот обработчик ОБЯЗАТЕЛЬНО нужен, чтобы middleware сохранял ВСЕ сообщения
  // Middleware вызывается только для зарегистрированных обработчиков!
  // ВАЖНО: Добавляем только если база данных включена
  if (userDatabaseEnabled) {
    code += '\n# Универсальный fallback-обработчик для всех необработанных текстовых сообщений\n';
    code += '@dp.message(F.text)\n';
    code += 'async def fallback_text_handler(message: types.Message):\n';
    code += '    """\n';
    code += '    Fallback обработчик для всех текстовых сообщений без специфичного обработчика.\n';
    code += '    Благодаря middleware, сообщение уже сохранено в БД.\n';
    code += '    Этот обработчик просто логирует факт необработанного сообщения.\n';
    code += '    """\n';
    code += '    logging.info(f"💬 Получено необработанное текстовое сообщение от {message.from_user.id}: {message.text}")\n';
    code += '    # Можно отправить ответ пользователю (опционально)\n';
    code += '    # await message.answer("Извините, я не понимаю эту команду. Используйте /start для начала.")\n\n';

    // Добавляем универсальный обработчик для фотографий
    code += '\n# Универсальный обработчик для необработанных фото\n';
    code += '@dp.message(F.photo)\n';
    code += 'async def handle_unhandled_photo(message: types.Message):\n';
    code += '    """\n';
    code += '    Обрабатывает фотографии, которые не были обработаны другими обработчиками.\n';
    code += '    Благодаря middleware, фото уже будет сохранено в БД.\n';
    code += '    """\n';
    code += '    logging.info(f"📸 Получено фото от пользователя {message.from_user.id}")\n';
    code += '    # Middleware автоматически сохранит фото\n';
    code += '\n';
  }

  code += '\n\n# Запуск бота\n';
  code += 'async def main():\n';
  if (userDatabaseEnabled) {
    code += '    global db_pool\n';
  }
  code += '    \n';
  code += '    # Обработчик сигналов для корректного завершения\n';
  code += '    def signal_handler(signum, frame):\n';
  code += '        print(f"🛑 Получен сигнал {signum}, начинаем корректное завершение...")\n';
  code += '        raise KeyboardInterrupt()\n';
  code += '    \n';
  code += '    # Регистрируем обработчики сигналов\n';
  code += '    signal.signal(signal.SIGTERM, signal_handler)\n';
  code += '    signal.signal(signal.SIGINT, signal_handler)\n';
  code += '    \n';
  code += '    try:\n';
  if (userDatabaseEnabled) {
    code += '        # Инициализируем базу данных\n';
    code += '        await init_database()\n';
  }
  if (menuCommands.length > 0) {
    code += '        await set_bot_commands()\n';
  }
  code += '        \n';
  if (userDatabaseEnabled) {
    code += '        # Регистрация middleware для сохранения сообщений\n';
    code += '        dp.message.middleware(message_logging_middleware)\n';
    // Регистрируем callback_query middleware только если в боте есть inline кнопки
    if (hasInlineButtons(nodes || [])) {
      code += '        dp.callback_query.middleware(callback_query_logging_middleware)\n';
    }
    code += '        \n';
  }
  code += '        print("🤖 Бот запущен и готов к работе!")\n';
  code += '        await dp.start_polling(bot)\n';
  code += '    except KeyboardInterrupt:\n';
  code += '        print("🛑 Получен сигнал остановки, завершаем работу...")\n';
  code += '    except SystemExit:\n';
  code += '        print("🛑 Системное завершение, завершаем работу...")\n';
  code += '    except Exception as e:\n';
  code += '        logging.error(f"Критическая ошибка: {e}")\n';
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
