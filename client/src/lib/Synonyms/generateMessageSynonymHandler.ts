import { Node } from '../../../../shared/schema';

export function generateMessageSynonymHandler(node: Node, synonym: string): string {
  const sanitizedNodeId = node.id.replace(/[^a-zA-Z0-9_]/g, '_');

  // Get all synonyms for this node to generate the list format
  const allSynonyms = node.data.synonyms || [synonym];
  const synonymsList = allSynonyms.map(s => `"${s.toLowerCase()}"`).join(', ');

  let code = `\n@dp.message(lambda message: message.text and message.text.lower() in [${synonymsList}])\n`;
  code += `async def message_${sanitizedNodeId}_synonyms_handler(message: types.Message):\n`;
  code += `    # Синонимы для сообщения ${node.id}\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    user_text = message.text.lower()\n`;
  code += `    logging.info(f"Пользователь {user_id} написал синоним '{user_text}' для узла ${node.id}")\n`;
  code += `    \n`;
  code += `    # Обрабатываем синоним как переход к узлу ${node.id}\n`;
  
  // Если есть target, переходим к нему, иначе просто отвечаем текстом узла
  if (node.data.target) {
    code += `    # Переходим к целевому узлу ${node.data.target}\n`;
    code += `    # Создаем Mock callback для эмуляции кнопки\n`;
    code += `    class MockCallback:\n`;
    code += `        def __init__(self, data, user, msg):\n`;
    code += `            self.data = data\n`;
    code += `            self.from_user = user\n`;
    code += `            self.message = msg\n`;
    code += `        async def answer(self):\n`;
    code += `            pass  # Mock метод, ничего не делаем\n`;
    code += `        async def edit_text(self, text, **kwargs):\n`;
    code += `            try:\n`;
    code += `                return await self.message.edit_text(text, **kwargs)\n`;
    code += `            except Exception as e:\n`;
    code += `                logging.warning(f"Не удалось отредактировать сообщение: {e}")\n`;
    code += `                return await self.message.answer(text, **kwargs)\n`;
    code += `    \n`;
    code += `    mock_callback = MockCallback("${node.data.target}", message.from_user, message)\n`;
    code += `    await handle_callback_${node.data.target.replace(/[^a-zA-Z0-9_]/g, '_')}(mock_callback)\n`;
  } else {
    // Просто отвечаем текстом узла
    const responseText = node.data.text || `Обработка синонима для ${node.id}`;
    code += `    await message.answer("${responseText}")\n`;
  }

  return code;
}
