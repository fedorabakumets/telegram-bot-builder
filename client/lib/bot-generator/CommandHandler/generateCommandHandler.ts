import { Node } from '@shared/schema';
import { generateConditionalMessageLogic } from '../Conditional/generateConditionalMessageLogic';
import { generateUniversalVariableReplacement } from '../database/generateUniversalVariableReplacement';
import { formatTextForPython } from '../format/formatTextForPython';
import { stripHtmlTags } from '../format/stripHtmlTags';
import { generateKeyboard } from '../Keyboard/generateKeyboard';
import { generateAttachedMediaSendCode } from '../MediaHandler/generateAttachedMediaSendCode';
import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

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
  codeLines.push(`    avatar_url = None`);
  codeLines.push(`    # Получаем аватарку пользователя`);
  codeLines.push(`    try:`);
  codeLines.push(`        photos = await bot.get_user_profile_photos(user_id)`);
  codeLines.push(`        if photos.photos and len(photos.photos) > 0:`);
  codeLines.push(`            last_photo = photos.photos[-1][-1]`);
  codeLines.push(`            file = await bot.get_file(last_photo.file_id)`);
  codeLines.push(`            avatar_url = file.file_path`);
  codeLines.push(`    except Exception as e:`);
  codeLines.push(`        logging.warning(f"Не удалось получить аватарку: {e}")`);
  codeLines.push(``);

  if (userDatabaseEnabled) {
    codeLines.push(`    # Сохраняем пользователя в базу данных`);
    codeLines.push(`    saved_to_db = await save_user_to_db(user_id, username, first_name, last_name, avatar_url)`);
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

  // Сохраняем медиа-переменные из данных узла в user_data (для использования в других узлах)
  // Используем имена переменных из attachedMedia для согласованности
  const attachedMedia = (node.data.attachedMedia) ? node.data.attachedMedia : [];
  
  if (node.data.imageUrl && node.data.imageUrl !== 'undefined') {
    // Находим переменную для изображения в attachedMedia или используем формат по умолчанию
    const imageVar = attachedMedia.find(v => v.includes('image') && v.includes('Url')) || `image_url_${node.id}`;
    codeLines.push(`    # Сохраняем imageUrl в переменную ${imageVar}`);
    codeLines.push(`    user_data[user_id] = user_data.get(user_id, {})`);
    codeLines.push(`    user_data[user_id]["${imageVar}"] = "${node.data.imageUrl}"`);
    if (userDatabaseEnabled) {
      codeLines.push(`    await update_user_data_in_db(user_id, "${imageVar}", "${node.data.imageUrl}")`);
    }
  }
  if (node.data.documentUrl) {
    // Находим переменную для документа в attachedMedia или используем формат по умолчанию
    const documentVar = attachedMedia.find(v => v.includes('document') && v.includes('Url')) || `document_url_${node.id}`;
    codeLines.push(`    # Сохраняем documentUrl в переменную ${documentVar}`);
    codeLines.push(`    user_id = message.from_user.id`);
    codeLines.push(`    user_data[user_id] = user_data.get(user_id, {})`);
    codeLines.push(`    user_data[user_id]["${documentVar}"] = "${node.data.documentUrl}"`);
    if (userDatabaseEnabled) {
      codeLines.push(`    await update_user_data_in_db(user_id, "${documentVar}", "${node.data.documentUrl}")`);
    }
  }
  if (node.data.videoUrl) {
    // Находим переменную для видео в attachedMedia или используем формат по умолчанию
    const videoVar = attachedMedia.find(v => v.includes('video') && v.includes('Url')) || `video_url_${node.id}`;
    codeLines.push(`    # Сохраняем videoUrl в переменную ${videoVar}`);
    codeLines.push(`    user_id = message.from_user.id`);
    codeLines.push(`    user_data[user_id] = user_data.get(user_id, {})`);
    codeLines.push(`    user_data[user_id]["${videoVar}"] = "${node.data.videoUrl}"`);
    if (userDatabaseEnabled) {
      codeLines.push(`    await update_user_data_in_db(user_id, "${videoVar}", "${node.data.videoUrl}")`);
    }
  }
  if (node.data.audioUrl) {
    // Находим переменную для аудио в attachedMedia или используем формат по умолчанию
    const audioVar = attachedMedia.find(v => v.includes('audio') && v.includes('Url')) || `audio_url_${node.id}`;
    codeLines.push(`    # Сохраняем audioUrl в переменную ${audioVar}`);
    codeLines.push(`    user_id = message.from_user.id`);
    codeLines.push(`    user_data[user_id] = user_data.get(user_id, {})`);
    codeLines.push(`    user_data[user_id]["${audioVar}"] = "${node.data.audioUrl}"`);
    if (userDatabaseEnabled) {
      codeLines.push(`    await update_user_data_in_db(user_id, "${audioVar}", "${node.data.audioUrl}")`);
    }
  }

  // Обработка сообщений
  const messageText = node.data.messageText || "🤖 Доступные команды:\n\n/start - Начать работу\n/help - Эта справка\n/settings - Настройки";
  const cleanedMessageText = stripHtmlTags(messageText);
  const formattedText = formatTextForPython(cleanedMessageText);

  if (node.data.enableConditionalMessages && node.data.conditionalMessages && node.data.conditionalMessages.length > 0) {
    codeLines.push(``);
    codeLines.push(`    # Проверяем условные сообщения`);
    codeLines.push(`    text = ${formattedText}  # Инициализируем текст по умолчанию`);
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
    const universalVarCodeLines: string[] = [];
    generateUniversalVariableReplacement(universalVarCodeLines, '    ');
    codeLines.push(...universalVarCodeLines);

  } else {
    codeLines.push(``);
    codeLines.push(`    text = ${formattedText}`);
    codeLines.push(``);
    codeLines.push(`    # Универсальная замена переменных`);

    // Добавляем универсальную замену переменных
    const universalVarCodeLines: string[] = [];
    generateUniversalVariableReplacement(universalVarCodeLines, '    ');
    codeLines.push(...universalVarCodeLines);
  }

  // Проверяем, есть ли прикрепленные медиафайлы (attachedMedia уже объявлен выше)
  const hasStaticImage = node.data.imageUrl && node.data.imageUrl.trim() !== '';

  // ИСПРАВЛЕНИЕ: Если есть attachedMedia или статическое изображение, используем generateAttachedMediaSendCode
  // В противном случае используем обычную логику с generateKeyboard
  if (attachedMedia.length > 0 || hasStaticImage) {
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
        node, // nodeData - передаем весь узел для доступа к imageUrl
        'message' // контекст обработчика
      );

      if (mediaCode.trim()) {
        // ИСПРАВЛЕНИЕ: Добавляем ТОЛЬКО код медиа, без generateKeyboard
        // generateAttachedMediaSendCode уже включает всю логику отправки медиа и клавиатуры
        const mediaLines = mediaCode.split('\n');
        codeLines.push(...mediaLines);
      } else {
        // Если код медиа не сгенерирован, используем обычную логику
        const keyboardCode = generateKeyboard(node);
        codeLines.push(...keyboardCode.split('\n').filter(line => line.trim()));
      }
    } else {
      // Если mediaVariablesMap не передан, но есть статическое изображение, используем обычную логику
      const keyboardCode = generateKeyboard(node);
      codeLines.push(...keyboardCode.split('\n').filter(line => line.trim()));
    }
  } else {
    // Обычная логика без медиа
    const keyboardCode = generateKeyboard(node);
    codeLines.push(...keyboardCode.split('\n').filter(line => line.trim()));
  }

  // Применяем автоматическое добавление комментариев ко всему коду
  const processedCode = processCodeWithAutoComments(codeLines, 'generateCommandHandler.ts');

  return processedCode.join('\n');
}
