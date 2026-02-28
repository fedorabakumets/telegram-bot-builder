/**
 * @fileoverview Генерация обработчиков команд
 * Функции для генерации Python-кода обработчиков командных кнопок
 */

/**
 * Генерирует обработчик callback-запроса для команды с симуляцией сообщения
 * @param commandCallback - Уникальный идентификатор callback для команды
 * @param code - Текущий Python код
 * @returns {string} Имя команды без префикса "cmd_"
 */
export const generateCommandCallbackHandler = (
  commandCallback: string,
  code: string
): string => {
  const command = commandCallback.replace('cmd_', '');
  
  code += `\n@dp.callback_query(lambda c: c.data == "${commandCallback}")\n`;
  code += `async def handle_${commandCallback}(callback_query: types.CallbackQuery):\n`;
  code += '    await callback_query.answer()\n';
  code += `    logging.info(f"Обработка кнопки команды: ${commandCallback} -> /${command} (пользователь {callback_query.from_user.id})")\n`;
  code += `    # Симулируем выполнение команды /${command}\n`;
  code += '    \n';
  code += '    # Создаем fake message object для команды\n';
  code += '    from types import SimpleNamespace\n';
  code += '    fake_message = SimpleNamespace()\n';
  code += '    fake_message.from_user = callback_query.from_user\n';
  code += '    fake_message.chat = callback_query.message.chat\n';
  code += '    fake_message.date = callback_query.message.date\n';
  code += '    fake_message.answer = callback_query.message.answer\n';
  code += '    fake_message.edit_text = callback_query.message.edit_text\n';
  code += '    \n';
  
  return command;
};

/**
 * Генерирует код триггера выполнения команды с оберткой
 * @param command - Имя команды для выполнения
 * @param code - Текущий Python код
 * @param commandNode - Узел команды
 * @returns {string} Обновлённый Python код
 */
export const generateCommandTrigger = (
  command: string,
  code: string,
  commandNode: any
): string => {
  if (commandNode) {
    if (commandNode.type === 'start') {
      code += '    # Вызываем start handler через edit_text\n';
      code += '    # Создаем специальный объект для редактирования сообщения\n';
      code += '    class FakeCallbackQuery:\n';
      code += '        def __init__(self, callback_query):\n';
      code += '            self.from_user = callback_query.from_user\n';
      code += '            self.chat = callback_query.message.chat\n';
      code += '            self.date = callback_query.message.date\n';
      code += '            self.message_id = callback_query.message.message_id\n';
      code += '            self.data = callback_query.data  # callback_data для навигации\n';
      code += '            self.message = callback_query.message\n';
      code += '            self._callback_query = callback_query\n';
      code += '        \n';
      code += '        async def answer(self, *args, **kwargs):\n';
      code += '            pass  # Игнорируем answer для fake callback\n';
      code += '        \n';
      code += '        async def edit_text(self, text, parse_mode=None, reply_markup=None):\n';
      code += '            await self._callback_query.message.edit_text(text, parse_mode=parse_mode, reply_markup=reply_markup)\n';
      code += '    \n';
      code += '    fake_callback = FakeCallbackQuery(callback_query)\n';
      code += '    await start_handler(fake_callback)\n';
    } else if (commandNode.type === 'command') {
      code += `    # Вызываем ${command} handler\n`;
      code += `    await ${command}_handler(fake_message)\n`;
    }
  } else {
    code += `    await callback_query.message.edit_text("Команда /${command} выполнена")\n`;
  }

  code += `    logging.info(f"Команда /${command} выполнена через callback кнопку (пользователь {callback_query.from_user.id})")\n`;

  return code;
};

/**
 * Находит узел команды по имени
 * @param command - Имя команды
 * @param nodes - Массив узлов бота
 * @returns {any|null} Узел команды или null
 */
export const findCommandNode = (command: string, nodes: any[]): any | null => {
  return nodes.find(
    n => n.data.command === `/${command}` || n.data.command === command
  ) || null;
};
