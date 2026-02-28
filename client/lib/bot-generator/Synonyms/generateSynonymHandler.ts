import { Node } from '@shared/schema';
import { generateUserManagementSynonymHandler } from '../UserHandler';

// ============================================================================
// ГЕНЕРАТОРЫ ОБРАБОТЧИКОВ СИНОНИМОВ
// ============================================================================
export function generateSynonymHandler(node: Node, synonym: string): string {
  const sanitizedSynonym = synonym.replace(/[^a-zA-Zа-яА-Я0-9_]/g, '_');
  const originalCommand = node.data.command || (node.type === 'start' ? '/start' : '/help');
  const functionName = originalCommand.replace('/', '').replace(/[^a-zA-Z0-9_]/g, '_');

  let code = `\n@dp.message(lambda message: message.text and message.text.lower() == "${synonym.toLowerCase()}")\n`;
  code += `async def ${functionName}_synonym_${sanitizedSynonym}_handler(message: types.Message):\n`;
  code += `    # Синоним для команды ${originalCommand}\n`;

  if (node.type === 'start') {
    code += '    # Проверяем, что start_handler существует перед вызовом\n';
    code += '    if "start_handler" in globals():\n';
    code += '        await start_handler(message)\n';
    code += '    else:\n';
    code += '        await message.answer("Команда /start временно недоступна")\n';
  } else {
    code += `    # Проверяем, что ${functionName}_handler существует перед вызовом\n`;
    code += `    if "${functionName}_handler" in globals():\n`;
    code += `        await ${functionName}_handler(message)\n`;
    code += '    else:\n';
    code += `        await message.answer("Команда ${originalCommand} временно недоступна")\n`;
  }

  return code;
}
/**
 * Генерирует обработчики синонимов для узлов
 * @param nodes - Массив узлов для генерации обработчиков синонимов
 * @returns Сгенерированный код обработчиков синонимов
 */

export function generateSynonymHandlers(nodes: Node[]): string {
  // Типы узлов, требующие специального обработчика управления пользователями
  const userManagementTypes = new Set([
    'ban_user', 'unban_user', 'mute_user', 'unmute_user',
    'kick_user', 'promote_user', 'demote_user', 'admin_rights'
  ]);

  const nodesWithSynonyms = nodes
    .filter(node => node !== null && node !== undefined) // Фильтруем null/undefined узлы
    .filter(node => node.data?.synonyms && node.data?.synonyms.length > 0
  )
  // Исключаем синонимы для узлов типа 'start', если нет самого узла типа 'start' в списке
  .filter(node => {
    if (node.type === 'start') {
      // Проверяем, есть ли в общем списке узлов хотя бы один узел типа 'start'
      const hasStartNode = nodes.some(n => n.type === 'start');
      return hasStartNode; // Создаем синоним только если есть узел типа 'start'
    }
    return true; // Для других типов узлов оставляем без изменений
  });

  // Если нет узлов с синонимами, возвращаем пустую строку
  if (nodesWithSynonyms.length === 0) return '';

  let synonymCode = '\n# Обработчики синонимов\n';

  for (const node of nodesWithSynonyms) {
    for (const synonym of node.data.synonyms) {
      // Маркеры для идентификации синонимов того же узла
      synonymCode += `# @@NODE_START:${node.id}@@\n`;

      if (node.type === 'start' || node.type === 'command') {
        synonymCode += generateSynonymHandler(node, synonym);
      } else if (userManagementTypes.has(node.type)) {
        synonymCode += generateUserManagementSynonymHandler(node, synonym);
      } else {
        synonymCode += generateMessageSynonymHandler(node, synonym);
      }

      synonymCode += `# @@NODE_END:${node.id}@@\n`;
    }
  }

  return synonymCode;
}export function generateMessageSynonymHandler(node: Node, synonym: string): string {
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
  code += `    await handle_callback_${sanitizedNodeId}(mock_callback)\n`;

  return code;
}

