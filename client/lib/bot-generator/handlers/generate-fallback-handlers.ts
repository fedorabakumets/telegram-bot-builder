/**
 * @fileoverview Fallback обработчики сообщений
 * Функции для генерации обработчиков необработанных сообщений
 */

/**
 * Генерирует fallback обработчики для необработанных сообщений
 * @param userDatabaseEnabled - Включена ли база данных пользователей
 * @returns {string} Python код обработчиков
 */
export const generateFallbackHandlers = (userDatabaseEnabled: boolean): string => {
  if (!userDatabaseEnabled) {
    return '';
  }

  let code = '';
  code += generateFallbackTextHandler();
  code += generateUnhandledPhotoHandler();
  return code;
};

/**
 * Генерирует fallback обработчик для необработанных текстовых сообщений
 * @returns {string} Python код обработчика
 */
export const generateFallbackTextHandler = (): string => {
  let code = '\n# Универсальный fallback-обработчик для всех необработанных текстовых сообщений\n';
  code += '@dp.message(F.text)\n';
  code += 'async def fallback_text_handler(message: types.Message):\n';
  code += '    """\n';
  code += '    Fallback обработчик для всех текстовых сообщений без специфичного обработчика.\n';
  code += '    Благодаря middleware, сообщение уже сохранено в БД.\n';
  code += '    Этот обработчик просто логирует факт необработанного сообщения.\n';
  code += '    """\n';
  code += '    logging.info(f"📩 Получено необработанное текстовое сообщение от {message.from_user.id}: {message.text}")\n';
  code += '    # Можно отправить ответ пользователю (опционально)\n';
  code += '    # await message.answer("Извините, я не понимаю эту команду. Используйте /start для начала.")\n\n';
  return code;
};

/**
 * Генерирует fallback обработчик для необработанных фотографий
 * @returns {string} Python код обработчика
 */
export const generateUnhandledPhotoHandler = (): string => {
  let code = '\n# Универсальный обработчик для необработанных фото\n';
  code += '@dp.message(F.photo)\n';
  code += 'async def handle_unhandled_photo(message: types.Message):\n';
  code += '    """\n';
  code += '    Обрабатывает фотографии, которые не были обработаны другими обработчиками.\n';
  code += '    Благодаря middleware, фото уже будет сохранено в БД.\n';
  code += '    """\n';
  code += '    logging.info(f"📸 Получено фото от пользователя {message.from_user.id}")\n';
  code += '    # Middleware автоматически сохранит фото\n';
  code += '\n';
  return code;
};
