import { Node } from '@shared/schema';
import { generateUniversalVariableReplacement } from '../database/generateUniversalVariableReplacement';
import { generateKeyboard } from '../Keyboard/generateKeyboard';
import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';
import { generateConditionalMessageLogicAndKeyboard } from './generateConditionalMessageLogicAndKeyboard';
import { generateKeyboardAndProcessAttachedMedia } from './generateKeyboardAndProcessAttachedMedia';
import { initializeAndRestoreMultipleSelectionState } from './initializeAndRestoreMultipleSelectionState';

// ============================================================================
// ГЕНЕРАТОРЫ ОБРАБОТЧИКОВ КОМАНД И СООБЩЕНИЙ
// ============================================================================

/**
 * Генерирует Python код обработчика команды /start для Telegram бота на основе конфигурации узла.
 * 
 * Эта функция создает асинхронный обработчик команды /start, который включает:
 * - Декоратор для регистрации команды в диспетчере бота
 * - Логирование вызова команды
 * - Проверки безопасности (приватные чаты, права администратора, авторизация)
 * - Регистрацию и сохранение информации о пользователе в БД и локальном хранилище
 * - Инициализацию пользовательских переменных и переменных окружения
 * - Поддержку множественного выбора с восстановлением состояния
 * - Обработку условных сообщений на основе данных пользователя
 * - Генерацию клавиатуры для интерактивного ответа
 * - Автоматические переходы между узлами (если настроены)
 * - Универсальную замену переменных в тексте сообщения
 * 
 * @param node - Узел конфигурации команды, содержащий настройки и данные команды
 * @param userDatabaseEnabled - Флаг, указывающий на использование базы данных для хранения пользователей
 * @returns Строку с Python кодом обработчика команды /start
 * 
 * @example
 * const node = {
 *   data: {
 *     messageText: "🤖 Добро пожаловать в наш бот!\n\nВыберите ваши интересы:",
 *     isPrivateOnly: true,
 *     adminOnly: false,
 *     requiresAuth: false,
 *     enableConditionalMessages: true,
 *     conditionalMessages: [...],
 *     allowMultipleSelection: true,
 *     buttons: [
 *       { text: "Спорт", action: "selection", target: "sport" },
 *       { text: "Музыка", action: "selection", target: "music" },
 *       { text: "Путешествия", action: "selection", target: "travel" }
 *     ],
 *     enableAutoTransition: true,
 *     autoTransitionTo: "main_menu",
 *     collectUserInput: true
 *   }
 * };
 * const code = generateStartHandler(node, true);
 */
export function generateStartHandler(node: Node, userDatabaseEnabled: boolean, mediaVariablesMap?: Map<string, { type: string; variable: string; }>): string {
  // Собираем весь код в массив строк для автоматической обработки
  const codeLines: string[] = [];

  // Декоратор и сигнатура функции
  codeLines.push('\n@dp.message(CommandStart())');
  codeLines.push('async def start_handler(message: types.Message):');

  // Проверяем, что node и node.data существуют, прежде чем использовать их
  if (node && node.data) {
    // Добавляем проверки безопасности
    if (node.data.isPrivateOnly) {
      codeLines.push('    if not await is_private_chat(message):');
      codeLines.push('        await message.answer("❌ Эта команда доступна только в приватных чатах")');
      codeLines.push('        return');
    }

    if (node.data.adminOnly) {
      codeLines.push('    if not await is_admin(message.from_user.id):');
      codeLines.push('        await message.answer("❌ У вас нет прав для выполнения этой команды")');
      codeLines.push('        return');
    }

    if (node.data.requiresAuth) {
      codeLines.push('    if not await check_auth(message.from_user.id):');
      codeLines.push('        await message.answer("❌ Необходимо войти в систему для выполнения этой команды")');
      codeLines.push('        return');
    }
  } else {
    // Если node или node.data не существуют, добавляем минимальный обработчик
    codeLines.push('    # Узел не содержит необходимых данных, генерируем минимальный обработчик');
    codeLines.push('    text = "Привет! Добро пожаловать!"');
    codeLines.push('    await message.answer(text)');
    codeLines.push('');

    // Применяем автоматическое добавление комментариев ко всему коду
    const processedCode = processCodeWithAutoComments(codeLines, 'generateStartHandler.ts');
    return processedCode.join('\n');
  }

  // Регистрируем пользователя и сохраняем его данные
  codeLines.push('');
  codeLines.push('    # Регистрируем пользователя в системе');
  codeLines.push('    user_id = message.from_user.id');
  codeLines.push('    username = message.from_user.username');
  codeLines.push('    first_name = message.from_user.first_name');
  codeLines.push('    last_name = message.from_user.last_name');
  codeLines.push('');

  if (userDatabaseEnabled) {
    codeLines.push('    # Сохраняем пользователя в базу данных');
    codeLines.push('    saved_to_db = await save_user_to_db(user_id, username, first_name, last_name)');
    codeLines.push('');
    codeLines.push('    # Сохраняем переменные пользователя в базу данных');
    codeLines.push('    user_name = init_user_variables(user_id, message.from_user)');
    codeLines.push('    await update_user_data_in_db(user_id, "user_name", user_name)');
    codeLines.push('    await update_user_data_in_db(user_id, "first_name", first_name)');
    codeLines.push('    await update_user_data_in_db(user_id, "last_name", last_name)');
    codeLines.push('    await update_user_data_in_db(user_id, "username", username)');
    codeLines.push('');
    codeLines.push('    # Резервное сохранение в локальное хранилище');
    codeLines.push('    if not saved_to_db:');
    codeLines.push('        user_data[user_id] = {');
    codeLines.push('            "username": username,');
    codeLines.push('            "first_name": first_name,');
    codeLines.push('            "last_name": last_name,');
    codeLines.push('            "user_name": user_name,');
    codeLines.push('            "registered_at": message.date');
    codeLines.push('        }');
    codeLines.push('        logging.info(f"Пользователь {user_id} сохранен в локальное хранилище")');
    codeLines.push('    else:');
    codeLines.push('        logging.info(f"Пользователь {user_id} сохранен в базу данных")');
    codeLines.push('');
  } else {
    codeLines.push('    # Инициализируем базовые переменные пользователя');
    codeLines.push('    user_name = init_user_variables(user_id, message.from_user)');
    codeLines.push('');
  }

  // Используем универсальную замену переменных для инициализации
  const universalVarCodeLines: string[] = [];
  generateUniversalVariableReplacement(universalVarCodeLines, '    ');
  codeLines.push(...universalVarCodeLines);

  // Сохраняем медиа-переменные из данных узла в user_data (для использования в других узлах)
  if (node && node.data && node.data.imageUrl && node.data.imageUrl !== 'undefined') {
    codeLines.push(`    # Сохраняем imageUrl в переменную image_url_${node.id || 'unknown'}`);
    codeLines.push(`    user_data[user_id] = user_data.get(user_id, {})`);
    codeLines.push(`    user_data[user_id]["image_url_${node.id || 'unknown'}"] = "${node.data.imageUrl}"`);
    if (userDatabaseEnabled) {
      codeLines.push(`    await update_user_data_in_db(user_id, "image_url_${node.id || 'unknown'}", "${node.data.imageUrl}")`);
    }
  }
  if (node && node.data && node.data.documentUrl) {
    codeLines.push(`    # Сохраняем documentUrl в переменную document_url_${node.id || 'unknown'}`);
    codeLines.push(`    user_data[user_id] = user_data.get(user_id, {})`);
    codeLines.push(`    user_data[user_id]["document_url_${node.id || 'unknown'}"] = "${node.data.documentUrl}"`);
    if (userDatabaseEnabled) {
      codeLines.push(`    await update_user_data_in_db(user_id, "document_url_${node.id || 'unknown'}", "${node.data.documentUrl}")`);
    }
  }
  if (node && node.data && node.data.videoUrl) {
    codeLines.push(`    # Сохраняем videoUrl в переменную video_url_${node.id || 'unknown'}`);
    codeLines.push(`    user_data[user_id] = user_data.get(user_id, {})`);
    codeLines.push(`    user_data[user_id]["video_url_${node.id || 'unknown'}"] = "${node.data.videoUrl}"`);
    if (userDatabaseEnabled) {
      codeLines.push(`    await update_user_data_in_db(user_id, "video_url_${node.id || 'unknown'}", "${node.data.videoUrl}")`);
    }
  }
  if (node && node.data && node.data.audioUrl) {
    codeLines.push(`    # Сохраняем audioUrl в переменную audio_url_${node.id || 'unknown'}`);
    codeLines.push(`    user_data[user_id] = user_data.get(user_id, {})`);
    codeLines.push(`    user_data[user_id]["audio_url_${node.id || 'unknown'}"] = "${node.data.audioUrl}"`);
    if (userDatabaseEnabled) {
      codeLines.push(`    await update_user_data_in_db(user_id, "audio_url_${node.id || 'unknown'}", "${node.data.audioUrl}")`);
    }
  }

  // Восстанавливаем состояние множественного выбора ТОЛЬКО если он включен
  initializeAndRestoreMultipleSelectionState(node, codeLines, userDatabaseEnabled);

  // Добавляем обработку условных сообщений
  const formattedText = generateKeyboardAndProcessAttachedMedia(node, codeLines);

  // Проверяем, есть ли прикрепленные медиафайлы
  const attachedMedia = (node && node.data && node.data.attachedMedia) ? node.data.attachedMedia : [];

  if (attachedMedia.length > 0) {
    // Если есть прикрепленные медиа, генерируем только код клавиатуры без отправки сообщения
    generateConditionalMessageLogicAndKeyboard(node, codeLines, mediaVariablesMap, attachedMedia, formattedText);
  } else {
    // Обычная логика без медиа - используем функцию generateKeyboard
    // Она генерирует полный код, включая отправку сообщения
    const keyboardCode = generateKeyboard(node);

    // Вставляем код клавиатуры в нужное место
    const keyboardLines = keyboardCode.split('\n').filter(line => line.trim());
    codeLines.push(...keyboardLines);

    // Возвращаемся, чтобы избежать дублирования отправки сообщения
    // Применяем автоматическое добавление комментариев ко всему коду
    const processedCode = processCodeWithAutoComments(codeLines, 'generateStartHandler.ts');
    return processedCode.join('\n');
  }

  // Применяем автоматическое добавление комментариев ко всему коду
  const processedCode = processCodeWithAutoComments(codeLines, 'generateStartHandler.ts');
  return processedCode.join('\n');
}



