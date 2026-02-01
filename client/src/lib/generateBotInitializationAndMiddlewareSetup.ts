/**
 * Генерирует код инициализации бота и настройки middleware
 * Создает Python код для инициализации базы данных, команд меню и middleware для логирования
 */
export function generateBotInitializationAndMiddlewareSetup(
  userDatabaseEnabled: boolean,
  menuCommands: any[],
  nodes: any[],
  hasInlineButtons: (nodes: any[]) => boolean,
  code: string
) {
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
  
  return code;
}