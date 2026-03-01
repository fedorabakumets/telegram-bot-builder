/**
 * @fileoverview Генерация обработчика команды /start для Telegram бота
 *
 * Модуль создаёт Python-код для обработки команды /start с поддержкой:
 * - Регистрации пользователей
 * - Отправки медиа (фото, видео, аудио, документы)
 * - Условных сообщений и клавиатур
 * - Автопереходов к следующим узлам
 *
 * @module bot-generator/CommandHandler/generateStartHandler
 */

import { Node } from '@shared/schema';
import { generateUniversalVariableReplacement } from '../database/generateUniversalVariableReplacement';
import { generateKeyboard } from '../Keyboard/generateKeyboard';
import { generateKeyboardOnly } from '../Keyboard/generateKeyboardOnly';
import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';
import { generateConditionalMessageLogicAndKeyboard } from './generateConditionalMessageLogicAndKeyboard';
import { generateKeyboardAndProcessAttachedMedia } from './generateKeyboardAndProcessAttachedMedia';
import { initializeAndRestoreMultipleSelectionState } from './initializeAndRestoreMultipleSelectionState';
import { generateStartHandlerImageSend } from './generateStartHandlerImageSend';
import { generateMessageText } from '../utils/generate-message-text';

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
  codeLines.push('    avatar_url = None');
  codeLines.push('    # Получаем аватарку пользователя');
  codeLines.push('    try:');
  codeLines.push('        photos = await bot.get_user_profile_photos(user_id)');
  codeLines.push('        if photos.photos and len(photos.photos) > 0:');
  codeLines.push('            last_photo = photos.photos[-1][-1]');
  codeLines.push('            file = await bot.get_file(last_photo.file_id)');
  codeLines.push('            avatar_url = file.file_path');
  codeLines.push('    except Exception as e:');
  codeLines.push('        logging.warning(f"Не удалось получить аватарку: {e}")');
  codeLines.push('');

  if (userDatabaseEnabled) {
    codeLines.push('    # Сохраняем пользователя в базу данных');
    codeLines.push('    saved_to_db = await save_user_to_db(user_id, username, first_name, last_name, avatar_url)');
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
  // Используем имена переменных из attachedMedia для согласованности
  const attachedMedia = (node && node.data && node.data.attachedMedia) ? node.data.attachedMedia : [];

  // ВАЖНО: Определяем текст сообщения ПЕРЕД отправкой медиа для использования в caption
  const messageTextLines = generateMessageText({ node, indent: '    ' });
  codeLines.push(...messageTextLines);

  // Сохраняем медиа-переменные из данных узла в user_data (для использования в других узлах)
  // Но НЕ отправляем изображение здесь — это будет сделано после создания all_user_vars
  if (node && node.data && node.data.imageUrl && node.data.imageUrl !== 'undefined') {
    // Находим переменную для изображения в attachedMedia или используем формат по умолчанию
    const imageVar = attachedMedia.find(v => v.includes('image') && v.includes('Url')) || attachedMedia.find(v => v.startsWith('imageUrlVar')) || `image_url_${node.id || 'unknown'}`;
    codeLines.push(`    # Сохраняем imageUrl в переменную ${imageVar}`);
    codeLines.push(`    user_data[user_id] = user_data.get(user_id, {})`);
    codeLines.push(`    user_data[user_id]["${imageVar}"] = "${node.data.imageUrl}"`);
    if (userDatabaseEnabled) {
      codeLines.push(`    await update_user_data_in_db(user_id, "${imageVar}", "${node.data.imageUrl}")`);
    }
  }
  if (node && node.data && node.data.documentUrl) {
    // Находим переменную для документа в attachedMedia или используем формат по умолчанию
    const documentVar = attachedMedia.find(v => v.includes('document') && v.includes('Url')) || attachedMedia.find(v => v.startsWith('documentUrlVar')) || `document_url_${node.id || 'unknown'}`;
    codeLines.push(`    # Сохраняем documentUrl в переменную ${documentVar}`);
    codeLines.push(`    user_data[user_id] = user_data.get(user_id, {})`);
    codeLines.push(`    user_data[user_id]["${documentVar}"] = "${node.data.documentUrl}"`);
    if (userDatabaseEnabled) {
      codeLines.push(`    await update_user_data_in_db(user_id, "${documentVar}", "${node.data.documentUrl}")`);
    }
  }
  if (node && node.data && node.data.videoUrl) {
    // Находим переменную для видео в attachedMedia или используем формат по умолчанию
    const videoVar = attachedMedia.find(v => v.includes('video') && v.includes('Url')) || attachedMedia.find(v => v.startsWith('videoUrlVar')) || `video_url_${node.id || 'unknown'}`;
    codeLines.push(`    # Сохраняем videoUrl в переменную ${videoVar}`);
    codeLines.push(`    user_data[user_id] = user_data.get(user_id, {})`);
    codeLines.push(`    user_data[user_id]["${videoVar}"] = "${node.data.videoUrl}"`);
    if (userDatabaseEnabled) {
      codeLines.push(`    await update_user_data_in_db(user_id, "${videoVar}", "${node.data.videoUrl}")`);
    }
  }
  if (node && node.data && node.data.audioUrl) {
    // Находим переменную для аудио в attachedMedia или используем формат по умолчанию
    const audioVar = attachedMedia.find(v => v.includes('audio') && v.includes('Url')) || attachedMedia.find(v => v.startsWith('audioUrlVar')) || `audio_url_${node.id || 'unknown'}`;
    codeLines.push(`    # Сохраняем audioUrl в переменную ${audioVar}`);
    codeLines.push(`    user_data[user_id] = user_data.get(user_id, {})`);
    codeLines.push(`    user_data[user_id]["${audioVar}"] = "${node.data.audioUrl}"`);
    if (userDatabaseEnabled) {
      codeLines.push(`    await update_user_data_in_db(user_id, "${audioVar}", "${node.data.audioUrl}")`);
    }
  }

  // Восстанавливаем состояние множественного выбора ТОЛЬКО если он включен
  initializeAndRestoreMultipleSelectionState(node as any, codeLines, userDatabaseEnabled);

  // Добавляем обработку условных сообщений
  const formattedText = generateKeyboardAndProcessAttachedMedia(node as any, codeLines);

  // Генерируем клавиатуру ПЕРЕД отправкой изображения
  // ПРИМЕЧАНИЕ: generateKeyboardOnly создаёт ТОЛЬКО код клавиатуры, без отправки сообщения
  const hasImageUrl = node && node.data && node.data.imageUrl && node.data.imageUrl !== 'undefined';
  if (hasImageUrl) {
    // Для узлов с imageUrl генерируем ТОЛЬКО код клавиатуры
    const keyboardOnlyCode = generateKeyboardOnly(node);
    if (keyboardOnlyCode) {
      const keyboardLines = keyboardOnlyCode.split('\n').filter(line => line.trim());
      codeLines.push(...keyboardLines);
    }
    // Затем отправляем изображение с уже созданной клавиатурой
    generateStartHandlerImageSend(node, codeLines);
  } else if (attachedMedia.length > 0) {
    // Если есть прикрепленные медиа (но нет imageUrl), генерируем код отправки медиа с клавиатурой
    generateConditionalMessageLogicAndKeyboard(node as any, codeLines, mediaVariablesMap, attachedMedia, formattedText);
  } else {
    // Обычная логика без медиа - используем функцию generateKeyboard
    // Она генерирует полный код, включая отправку сообщения
    const keyboardCode = generateKeyboard(node);
    const keyboardLines = keyboardCode.split('\n').filter(line => line.trim());
    codeLines.push(...keyboardLines);
  }

  // ============================================================================
  // АВТОПЕРЕХОД: Если у узла есть enableAutoTransition и autoTransitionTo
  // ============================================================================
  if (node.data.enableAutoTransition && node.data.autoTransitionTo) {
    const autoTargetId = node.data.autoTransitionTo;
    const safeFuncName = autoTargetId.replace(/[^a-zA-Z0-9_]/g, '_');
    codeLines.push('    ');
    codeLines.push('    # ⚡ АВТОПЕРЕХОД к следующему узлу');
    codeLines.push(`    logging.info(f"⚡ Автопереход от узла ${node.id} к узлу ${autoTargetId}")`);
    codeLines.push('    # Вызываем обработчик следующего узла через fake_callback');
    codeLines.push('    class FakeCallbackQuery:');
    codeLines.push('        def __init__(self, message, target_node_id):');
    codeLines.push('            self.from_user = message.from_user');
    codeLines.push('            self.chat = message.chat');
    codeLines.push('            self.date = message.date');
    codeLines.push('            self.message_id = message.message_id');
    codeLines.push('            self.data = target_node_id  # callback_data для навигации');
    codeLines.push('            self.message = message  # ссылка на оригинальное сообщение');
    codeLines.push('            self._is_fake = True  # Флаг что это fake callback');
    codeLines.push('        ');
    codeLines.push('        async def answer(self, *args, **kwargs):');
    codeLines.push('            pass  # Игнорируем answer для fake callback');
    codeLines.push('    ');
    codeLines.push(`    fake_callback = FakeCallbackQuery(message, "${autoTargetId}")`);
    codeLines.push('    try:');
    codeLines.push(`        await handle_callback_${safeFuncName}(fake_callback)`);
    codeLines.push(`        logging.info(f"✅ Автопереход выполнен: ${node.id} -> ${autoTargetId}")`);
    codeLines.push('    except Exception as e:');
    codeLines.push(`        logging.error(f"Ошибка при автопереходе к узлу ${autoTargetId}: {e}")`);
    codeLines.push('        await message.answer("Переход завершен")');
    codeLines.push('    return');
  }

  // Применяем автоматическое добавление комментариев ко всему коду
  const processedCode = processCodeWithAutoComments(codeLines, 'generateStartHandler.ts');
  return processedCode.join('\n');
}



