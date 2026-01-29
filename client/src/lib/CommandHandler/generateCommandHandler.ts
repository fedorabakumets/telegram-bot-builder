import { getParseMode } from '../format/getParseMode';
import { stripHtmlTags } from '../format/stripHtmlTags';
import { formatTextForPython } from '../format/formatTextForPython';
import { generateUniversalVariableReplacement } from '../generateUniversalVariableReplacement';
import { generateConditionalMessageLogic } from '../Conditional/generateConditionalMessageLogic';
import { generateKeyboard } from '../Keyboard/generateKeyboard';
import { Node } from '../../../../shared/schema';

export function generateCommandHandler(node: Node, userDatabaseEnabled: boolean): string {
  const command = node.data.command || "/help";
  const functionName = command.replace('/', '').replace(/[^a-zA-Z0-9_]/g, '_');

  let code = `\n@dp.message(Command("${command.replace('/', '')}"))\n`;
  code += `async def ${functionName}_handler(message: types.Message):\n`;

  // Добавляем логирование для отладки
  code += `    logging.info(f"Команда ${command} вызвана пользователем {message.from_user.id}")\n`;

  // Добавляем проверки безопасности
  if (node.data.isPrivateOnly) {
    code += '    if not await is_private_chat(message):\n';
    code += '        await message.answer("❌ Эта команда доступна только в приватных чатах")\n';
    code += '        return\n';
  }

  if (node.data.adminOnly) {
    code += '    if not await is_admin(message.from_user.id):\n';
    code += '        await message.answer("❌ У вас нет прав для выполнения этой команды")\n';
    code += '        return\n';
  }

  if (node.data.requiresAuth) {
    code += '    if not await check_auth(message.from_user.id):\n';
    code += '        await message.answer("❌ Необходимо войти в систему для выполнения этой команды")\n';
    code += '        return\n';
  }

  // Сохраняем информацию о команде в пользовательских данных
  code += '    # Сохраняем пользователя и статистику использования команд\n';
  code += '    user_id = message.from_user.id\n';
  code += '    username = message.from_user.username\n';
  code += '    first_name = message.from_user.first_name\n';
  code += '    last_name = message.from_user.last_name\n';
  code += '    \n';

  if (userDatabaseEnabled) {
    code += '    # Сохраняем пользователя в базу данных\n';
    code += '    saved_to_db = await save_user_to_db(user_id, username, first_name, last_name)\n';
    code += '    \n';
    code += '    # Инициализируем базовые переменные пользователя\n';
    code += '    user_name = init_user_variables(user_id, message.from_user)\n';
    code += '    await update_user_data_in_db(user_id, "user_name", user_name)\n';
    code += '    await update_user_data_in_db(user_id, "first_name", first_name)\n';
    code += '    await update_user_data_in_db(user_id, "last_name", last_name)\n';
    code += '    await update_user_data_in_db(user_id, "username", username)\n';
    code += '    \n';
    code += '    # Обновляем статистику команд в БД\n';
    code += `    if saved_to_db:\n`;
    code += `        await update_user_data_in_db(user_id, "command_${command.replace('/', '')}", datetime.now().isoformat())\n`;
    code += '    \n';
  }

  code += '    # Сохранение в локальное хранилище\n';
  code += '    # Инициализируем базовые переменные пользователя в локальном хранилище\n';
  code += '    user_name = init_user_variables(user_id, message.from_user)\n';
  code += '    \n';
  code += '    if "commands_used" not in user_data[user_id]:\n';
  code += '        user_data[user_id]["commands_used"] = {}\n';
  code += `    user_data[user_id]["commands_used"]["${command}"] = user_data[user_id]["commands_used"].get("${command}", 0) + 1\n`;

  // Добавляем обработку условных сообщений
  const messageText = node.data.messageText || "🤖 Доступные команды:\n\n/start - Начать работу\n/help - Эта справка\n/settings - Настройки";
  const cleanedMessageText = stripHtmlTags(messageText); // Удаляем HTML теги
  const formattedText = formatTextForPython(cleanedMessageText);
  const parseMode = getParseMode(node.data.formatMode || (node.data.markdown ? 'markdown' : ''));

  if (node.data.enableConditionalMessages && node.data.conditionalMessages && node.data.conditionalMessages.length > 0) {
    code += '\n    # Проверяем условные сообщения\n';
    code += '    text = None\n';
    code += '    \n';
    code += '    # Получаем данные пользователя для проверки условий\n';
    if (userDatabaseEnabled) {
      code += '    user_record = await get_user_from_db(user_id)\n';
      code += '    if not user_record:\n';
      code += '        user_record = user_data.get(user_id, {})\n';
    } else {
      code += '    user_record = user_data.get(user_id, {})\n';
    }
    code += '    \n';
    code += '    # Безопасно извлекаем user_data\n';
    code += '    if isinstance(user_record, dict):\n';
    code += '        if "user_data" in user_record and isinstance(user_record["user_data"], dict):\n';
    code += '            user_data_dict = user_record["user_data"]\n';
    code += '        else:\n';
    code += '            user_data_dict = user_record\n';
    code += '    else:\n';
    code += '        user_data_dict = {}\n';
    code += '    \n';

    // Generate conditional logic using helper function
    code += generateConditionalMessageLogic(node.data.conditionalMessages, '    ');

    // Add fallback
    code += '    else:\n';

    if (node.data.fallbackMessage) {
      const cleanedFallbackText = stripHtmlTags(node.data.fallbackMessage);
      const fallbackText = formatTextForPython(cleanedFallbackText);
      code += `        text = ${fallbackText}\n`;
      code += '        logging.info("Используется запасное сообщение")\n';
    } else {
      code += `        text = ${formattedText}\n`;
      code += '        logging.info("Используется основное сообщение узла")\n';
    }

    code += '    \n';
  } else {
    code += `\n    text = ${formattedText}\n`;

    // Добавляем замену переменных для обычных команд
    code += '    \n';
    code += generateUniversalVariableReplacement('    ');
  }

  return code + generateKeyboard(node);
}
