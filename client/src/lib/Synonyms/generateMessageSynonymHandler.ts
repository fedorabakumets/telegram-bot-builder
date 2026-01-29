import { Node } from '../../../../shared/schema';

export function generateMessageSynonymHandler(node: Node, synonym: string): string {
  const sanitizedSynonym = synonym.replace(/[^a-zA-Zа-яА-Я0-9_]/g, '_');
  const sanitizedNodeId = node.id.replace(/[^a-zA-Z0-9_]/g, '_');

  let code = `\n@dp.message(lambda message: message.text and message.text.lower() == "${synonym.toLowerCase()}")\n`;
  code += `async def message_${sanitizedNodeId}_synonym_${sanitizedSynonym}_handler(message: types.Message):\n`;
  code += `    # Синоним для сообщения ${node.id}\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    logging.info(f"Пользователь {user_id} написал синоним '${synonym}' для узла ${node.id}")\n`;
  code += `    \n`;
  code += `    # Обрабатываем синоним как переход к узлу ${node.id}\n`;
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
  code += `    mock_callback = MockCallback("${node.id}", message.from_user, message)\n`;
  code += `    await handle_callback_pin_message_${sanitizedNodeId}(mock_callback)\n`;

  return code;
}
