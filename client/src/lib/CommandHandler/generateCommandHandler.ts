import { stripHtmlTags } from '../format/stripHtmlTags';
import { formatTextForPython } from '../format/formatTextForPython';
import { generateUniversalVariableReplacement } from '../utils/generateUniversalVariableReplacement';
import { generateConditionalMessageLogic } from '../Conditional/generateConditionalMessageLogic';
import { generateKeyboard } from '../Keyboard/generateKeyboard';
import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';
import { generateAttachedMediaSendCode } from '../MediaHandler/generateAttachedMediaSendCode';
import { Node } from '@shared/schema';

/**
 * Генерирует Python код обработчика команды для Telegram бота на основе конфигурации узла.
 * 
 * Эта функция создает асинхронный обработчик команды, который включает:
 * - Логирование вызова команды
 * - Проверки безопасности (приватные чаты, права администратора, авторизация)
 * - Сохранение информации о пользователе в БД и локальном хранилище
 * - Обработку условных сообщений на основе данных пользователя
 * - Генерацию клавиатуры для интерактивного ответа
 * - Универсальную замену переменных в тексте сообщения
 * 
 * @param node - Узел конфигурации команды, содержащий настройки и данные команды
 * @param userDatabaseEnabled - Флаг, указывающий на использование базы данных для хранения пользователей
 * @returns Строку с Python кодом обработчика команды
 * 
 * @example
 * const node = {
 *   data: {
 *     command: "/help",
 *     messageText: "🤖 Доступные команды:\n\n/start - Начать работу\n/help - Эта справка",
 *     isPrivateOnly: true,
 *     adminOnly: false,
 *     requiresAuth: false,
 *     enableConditionalMessages: true,
 *     conditionalMessages: [...]
 *   }
 * };
 * const code = generateCommandHandler(node, true);
 */
export function generateCommandHandler(node: Node, userDatabaseEnabled: boolean, mediaVariablesMap?: Map<string, { type: string; variable: string; }>): string {
  // Извлекаем команду из узла или используем значение по умолчанию
  const command = node.data.command || "/help";
  
  // Генерируем имя функции на основе команды, заменяя недопустимые символы
  const functionName = command.replace('/', '').replace(/[^a-zA-Z0-9_]/g, '_');

  // Собираем весь код в массив строк для автоматической обработки
  const codeLines: string[] = [];

  // Декоратор и сигнатура функции
  codeLines.push(`@dp.message(Command("${command.replace('/', '')}"))`);
  codeLines.push(`async def ${functionName}_handler(message: types.Message):`);

  // Логирование вызова команды
  codeLines.push(`    logging.info(f"Команда ${command} вызвана пользователем {message.from_user.id}")`);

  // Проверки безопасности
  if (node.data.isPrivateOnly) {
    codeLines.push(`    if not await is_private_chat(message):`);
    codeLines.push(`        await message.answer("❌ Эта команда доступна только в приватных чатах")`);
    codeLines.push(`        return`);
  }

  if (node.data.adminOnly) {
    codeLines.push(`    if not await is_admin(message.from_user.id):`);
    codeLines.push(`        await message.answer("❌ У вас нет прав для выполнения этой команды")`);
    codeLines.push(`        return`);
  }

  if (node.data.requiresAuth) {
    codeLines.push(`    if not await check_auth(message.from_user.id):`);
    codeLines.push(`        await message.answer("❌ Необходимо войти в систему для выполнения этой команды")`);
    codeLines.push(`        return`);
  }

  // Сохранение информации о пользователе
  codeLines.push(`    # Сохраняем пользователя и статистику использования команд`);
  codeLines.push(`    user_id = message.from_user.id`);
  codeLines.push(`    username = message.from_user.username`);
  codeLines.push(`    first_name = message.from_user.first_name`);
  codeLines.push(`    last_name = message.from_user.last_name`);
  codeLines.push(``);

  if (userDatabaseEnabled) {
    codeLines.push(`    # Сохраняем пользователя в базу данных`);
    codeLines.push(`    saved_to_db = await save_user_to_db(user_id, username, first_name, last_name)`);
    codeLines.push(``);
    codeLines.push(`    # Инициализируем базовые переменные пользователя`);
    codeLines.push(`    user_name = init_user_variables(user_id, message.from_user)`);
    codeLines.push(`    await update_user_data_in_db(user_id, "user_name", user_name)`);
    codeLines.push(`    await update_user_data_in_db(user_id, "first_name", first_name)`);
    codeLines.push(`    await update_user_data_in_db(user_id, "last_name", last_name)`);
    codeLines.push(`    await update_user_data_in_db(user_id, "username", username)`);
    codeLines.push(``);
    codeLines.push(`    # Обновляем статистику команд в БД`);
    codeLines.push(`    if saved_to_db:`);
    codeLines.push(`        await update_user_data_in_db(user_id, "command_${command.replace('/', '')}", datetime.now().isoformat())`);
    codeLines.push(``);
  }

  codeLines.push(`    # Сохранение в локальное хранилище`);
  codeLines.push(`    # Инициализируем базовые переменные пользователя в локальном хранилище`);
  codeLines.push(`    user_name = init_user_variables(user_id, message.from_user)`);
  codeLines.push(``);
  codeLines.push(`    if "commands_used" not in user_data[user_id]:`);
  codeLines.push(`        user_data[user_id]["commands_used"] = {}`);
  codeLines.push(`    user_data[user_id]["commands_used"]["${command}"] = user_data[user_id]["commands_used"].get("${command}", 0) + 1`);

  // Обработка сообщений
  const messageText = node.data.messageText || "🤖 Доступные команды:\n\n/start - Начать работу\n/help - Эта справка\n/settings - Настройки";
  const cleanedMessageText = stripHtmlTags(messageText);
  const formattedText = formatTextForPython(cleanedMessageText);

  if (node.data.enableConditionalMessages && node.data.conditionalMessages && node.data.conditionalMessages.length > 0) {
    codeLines.push(``);
    codeLines.push(`    # Проверяем условные сообщения`);
    codeLines.push(`    text = None`);
    codeLines.push(``);
    codeLines.push(`    # Получаем данные пользователя для проверки условий`);
    if (userDatabaseEnabled) {
      codeLines.push(`    user_record = await get_user_from_db(user_id)`);
      codeLines.push(`    if not user_record:`);
      codeLines.push(`        user_record = user_data.get(user_id, {})`);
    } else {
      codeLines.push(`    user_record = user_data.get(user_id, {})`);
    }
    codeLines.push(``);
    codeLines.push(`    # Безопасно извлекаем user_data`);
    codeLines.push(`    if isinstance(user_record, dict):`);
    codeLines.push(`        if "user_data" in user_record and isinstance(user_record["user_data"], dict):`);
    codeLines.push(`            user_data_dict = user_record["user_data"]`);
    codeLines.push(`        else:`);
    codeLines.push(`            user_data_dict = user_record`);
    codeLines.push(`    else:`);
    codeLines.push(`        user_data_dict = {}`);
    codeLines.push(``);

    // Генерируем условную логику
    const conditionalCode = generateConditionalMessageLogic(node.data.conditionalMessages, '    ');
    const conditionalLines = conditionalCode.split('\n').filter(line => line.trim());
    codeLines.push(...conditionalLines);

    // Fallback
    codeLines.push(`    else:`);
    if (node.data.fallbackMessage) {
      const cleanedFallbackText = stripHtmlTags(node.data.fallbackMessage);
      const fallbackText = formatTextForPython(cleanedFallbackText);
      codeLines.push(`        text = ${fallbackText}`);
      codeLines.push(`        logging.info("Используется запасное сообщение")`);
    } else {
      codeLines.push(`        text = ${formattedText}`);
      codeLines.push(`        logging.info("Используется основное сообщение узла")`);
    }

    codeLines.push(``);
    codeLines.push(`    # Универсальная замена переменных`);

    // Добавляем универсальную замену переменных
    const variableReplacementCode = generateUniversalVariableReplacement('    ');
    const variableLines = variableReplacementCode.split('\n').filter(line => line.trim());
    codeLines.push(...variableLines);

  } else {
    codeLines.push(``);
    codeLines.push(`    text = ${formattedText}`);
    codeLines.push(``);
    codeLines.push(`    # Универсальная замена переменных`);

    // Добавляем универсальную замену переменных
    const variableReplacementCode = generateUniversalVariableReplacement('    ');
    const variableLines = variableReplacementCode.split('\n').filter(line => line.trim());
    codeLines.push(...variableLines);
  }

  // Проверяем, есть ли прикрепленные медиафайлы
  const attachedMedia = node.data.attachedMedia || [];

  if (attachedMedia.length > 0) {
    // Используем переданный mediaVariablesMap
    if (mediaVariablesMap) {
      // Фильтруем mediaVariablesMap, чтобы получить только те переменные, которые связаны с этим узлом
      const filteredMediaVariablesMap = new Map<string, { type: string; variable: string; }>();

      attachedMedia.forEach((mediaVar: string) => {
        if (mediaVariablesMap.has(mediaVar)) {
          filteredMediaVariablesMap.set(mediaVar, mediaVariablesMap.get(mediaVar)!);
        }
      });

      // Генерируем код для отправки прикрепленных медиа
      const mediaCode = generateAttachedMediaSendCode(
        attachedMedia,
        filteredMediaVariablesMap,
        formattedText, // текст сообщения
        node.data.formatMode || 'HTML', // режим парсинга
        'keyboard', // клавиатура
        node.id, // ID узла
        '    ', // отступ
        node.data.autoTransitionTo, // автопереход
        node.data.collectUserInput !== false, // собирать пользовательский ввод
        undefined, // nodeData
        'message' // контекст обработчика
      );

      if (mediaCode.trim()) {
        // Добавляем код медиа
        const mediaLines = mediaCode.split('\n');
        codeLines.push(...mediaLines);
      } else {
        // Если код медиа не сгенерирован, используем обычную логику
        // Добавляем клавиатуру
        const keyboardCode = generateKeyboard(node);
        const keyboardLines = keyboardCode.split('\n').filter(line => line.trim());
        codeLines.push(...keyboardLines);

        const keyboardParam = keyboardCode.includes('keyboard') ? ', reply_markup=keyboard' : '';
        codeLines.push(`    await message.answer(text${keyboardParam})`);
      }
    } else {
      // Если mediaVariablesMap не передан, используем обычную логику
      // Добавляем клавиатуру
      const keyboardCode = generateKeyboard(node);
      const keyboardLines = keyboardCode.split('\n').filter(line => line.trim());
      codeLines.push(...keyboardLines);

      const keyboardParam = keyboardCode.includes('keyboard') ? ', reply_markup=keyboard' : '';
      codeLines.push(`    await message.answer(text${keyboardParam})`);
    }
  } else {
    // Обычная логика без медиа
    // Добавляем клавиатуру
    const keyboardCode = generateKeyboard(node);
    const keyboardLines = keyboardCode.split('\n').filter(line => line.trim());
    codeLines.push(...keyboardLines);

    const keyboardParam = keyboardCode.includes('keyboard') ? ', reply_markup=keyboard' : '';
    codeLines.push(`    await message.answer(text${keyboardParam})`);
  }

  // Применяем автоматическое добавление комментариев ко всему коду
  const processedCode = processCodeWithAutoComments(codeLines, 'generateCommandHandler.ts');

  return processedCode.join('\n');
}
