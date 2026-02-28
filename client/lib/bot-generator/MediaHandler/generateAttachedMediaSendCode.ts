/**
 * @fileoverview Генерация кода отправки медиа-сообщений
 * 
 * Модуль предоставляет функцию для генерации Python-кода отправки медиа-сообщений
 * (photo, video, audio, document) с поддержкой статических изображений, автопереходов
 * и обработки ошибок.
 * 
 * @module generateAttachedMediaSendCode
 */

import { isLoggingEnabled } from "../../bot-generator";
import { generateWaitingStateCode } from "../format/generateWaitingStateCode";
import { processCodeWithAutoComments } from "../utils/generateGeneratedComment";

// ============================================================================
// ГЕНЕРАТОРЫ МЕДИА И УСЛОВНЫХ СООБЩЕНИЙ
// ============================================================================

/**
 * Генерирует Python код для отправки медиа-сообщений из переменных attachedMedia.
 * Функция создает полный Python код с обработкой различных типов медиа (изображения, видео, аудио, документы),
 * поддержкой статических изображений, автопереходов между узлами и обработкой ошибок.
 * 
 * Логика работы:
 * 1. Проверяет наличие статического изображения в узле и обрабатывает его отдельно
 * 2. Обрабатывает динамические медиа из переменных attachedMedia
 * 3. Генерирует код в зависимости от типа медиа (photo, video, audio, document)
 * 4. Поддерживает автопереходы между узлами при необходимости
 * 5. Устанавливает состояние ожидания ввода для узлов, которые собирают данные от пользователя
 * 6. Предоставляет fallback на текстовые сообщения при ошибках или отсутствии медиа
 * 
 * @param attachedMedia - Массив переменных медиа для отправки
 * @param mediaVariablesMap - Карта соответствий переменных медиа и их типов
 * @param _text - Текст сообщения для отправки (не используется напрямую)
 * @param parseMode - Режим форматирования текста (HTML, Markdown, etc.)
 * @param keyboard - Клавиатура для отправки вместе с сообщением
 * @param nodeId - Идентификатор текущего узла
 * @param indentLevel - Уровень отступа для генерируемого кода
 * @param autoTransitionTo - Идентификатор узла для автоперехода (опционально)
 * @param collectUserInput - Флаг сбора ввода от пользователя (по умолчанию true)
 * @param nodeData - Дополнительные данные узла (опционально)
 * @returns Сгенерированный Python код для отправки медиа
 * 
 * @example
 * // Базовое использование для отправки изображения
 * const code = generateAttachedMediaSendCode(
 *   ['image_url_node1'],
 *   new Map([['image_url_node1', { type: 'photo', variable: 'image_url_node1' }]]),
 *   'Посмотрите на это изображение',
 *   'HTML',
 *   'None',
 *   'node1',
 *   '    ',
 *   undefined,
 *   true
 * );
 * 
 * @example
 * // С автопереходом и клавиатурой
 * const code = generateAttachedMediaSendCode(
 *   ['video_url_node2'],
 *   new Map([['video_url_node2', { type: 'video', variable: 'video_url_node2' }]]),
 *   'Смотрите видео!',
 *   'HTML',
 *   'keyboard_object',
 *   'node2',
 *   '    ',
 *   'node3',
 *   false
 * );
 * 
 * @example
 * // Со статическим изображением
 * const nodeData = { imageUrl: 'https://example.com/image.jpg' };
 * const code = generateAttachedMediaSendCode(
 *   [],
 *   new Map(),
 *   'Статическое изображение',
 *   'None',
 *   'None',
 *   'node4',
 *   '    ',
 *   undefined,
 *   true,
 *   nodeData
 * );
 */
export function generateAttachedMediaSendCode(
  attachedMedia: string[],
  mediaVariablesMap: Map<string, { type: string; variable: string; }>,
  _text: string,
  parseMode: string,
  keyboard: string,
  nodeId: string,
  indentLevel: string,
  autoTransitionTo?: string,
  collectUserInput: boolean = true,
  nodeData?: any,
  handlerContext: 'message' | 'callback' = 'callback'): string {
  
  // Собираем весь код в массив строк для автоматической обработки комментариев
  const codeLines: string[] = [];

  // Объявляем переменные для правильного контекста
  const userIdSource = handlerContext === 'message' ? 'message.from_user.id' : 'callback_query.from_user.id';
  const messageSource = handlerContext === 'message' ? 'message' : 'callback_query';

  // Проверяем, есть ли статическое изображение в узле
  const hasStaticImage = nodeData && nodeData.imageUrl && nodeData.imageUrl.trim() !== '' && nodeData.imageUrl !== 'undefined';

  // ИСПРАВЛЕНИЕ: Если есть статическое изображение, используем его напрямую
  if (hasStaticImage) {
    // ИСПРАВЛЕНИЕ: Генерируем клавиатуру если есть кнопки у узла
    const hasButtons = nodeData && nodeData.data && nodeData.data.buttons && nodeData.data.buttons.length > 0;
    const hasReplyKeyboard = nodeData && nodeData.data && nodeData.data.keyboardType === 'reply';
    const hasInlineKeyboard = nodeData && nodeData.data && nodeData.data.keyboardType === 'inline';

    if (hasButtons && (hasReplyKeyboard || hasInlineKeyboard)) {
      // Генерируем код клавиатуры
      const { generateKeyboard } = require('../Keyboard/generateKeyboard');
      const keyboardCode = generateKeyboard(nodeData);

      // ИСПРАВЛЕНИЕ: Извлекаем только код генерации клавиатуры, без отправки сообщения
      // Разбираем сгенерированный код на строки
      const keyboardLines = keyboardCode.split('\n');

      for (const line of keyboardLines) {
        // Пропускаем строки, которые отправляют сообщения (await message.answer или await bot.send_photo)
        if (line.includes('await message.answer') || line.includes('await bot.send_photo')) {
          continue;
        }
        // Добавляем строки, которые генерируют клавиатуру
        codeLines.push(line);
      }
    }

    // Убедимся, что переменная keyboard определена (не затираем если существует)
    codeLines.push(`${indentLevel}# Убедимся, что переменная keyboard определена`);
    codeLines.push(`${indentLevel}# ВАЖНО: Не затираем keyboard, если он уже существует (сгенерирован ранее)`);
    codeLines.push(`${indentLevel}`);

    codeLines.push(`${indentLevel}# Узел содержит статическое изображение: ${nodeData.imageUrl}`);
    // Проверяем, является ли URL относительным путем к локальному файлу
    if (nodeData.imageUrl && nodeData.imageUrl.startsWith('/uploads/')) {
      // Для локальных файлов используем FSInputFile для отправки напрямую с диска
      codeLines.push(`${indentLevel}image_path = get_upload_file_path("${nodeData.imageUrl}")`);
      codeLines.push(`${indentLevel}image_url = FSInputFile(image_path)`);
    } else {
      codeLines.push(`${indentLevel}image_url = "${nodeData.imageUrl}"`);
      codeLines.push(`${indentLevel}logging.info(f"🖼️ Отправка изображения: {image_url}")`);
    }

    // Устанавливаем состояние ожидания ввода если нужно
    if (collectUserInput && nodeData) {
      codeLines.push(`${indentLevel}# Устанавливаем состояние ожидания ввода для узла ${nodeId}`);
      if (nodeData && nodeData.data) {
        const waitingStateCode = generateWaitingStateCode(nodeData, indentLevel, userIdSource);
        const waitingStateLines = waitingStateCode.split('\n').filter(line => line.trim());
        codeLines.push(...waitingStateLines);
      }
      codeLines.push(`${indentLevel}logging.info(f"✅ Узел ${nodeId} настроен для сбора ввода (collectUserInput=true) после отправки изображения")`);
    }

    codeLines.push(`${indentLevel}# Отправляем статическое изображение`);
    codeLines.push(`${indentLevel}try:`);
    codeLines.push(`${indentLevel}    # Заменяем переменные в тексте перед отправкой`);
    codeLines.push(`${indentLevel}    # Используем all_user_vars вместо user_vars для корректной замены переменных`);
    codeLines.push(`${indentLevel}    processed_caption = replace_variables_in_text(text, all_user_vars)`);

    // ИСПРАВЛЕНИЕ: Генерируем parse_mode только если parseMode не пустой и не равен "none"
    let parseModeParam = '';
    if (parseMode && parseMode.trim() !== '' && parseMode.trim().toLowerCase() !== 'none') {
      parseModeParam = `, parse_mode=ParseMode.${parseMode.toUpperCase()}`;
    }

    // ИСПРАВЛЕНИЕ: Добавляем клавиатуру если она определена
    codeLines.push(`${indentLevel}    if keyboard is not None:`);
    codeLines.push(`${indentLevel}        await bot.send_photo(${userIdSource}, image_url, caption=processed_caption${parseModeParam}, reply_markup=keyboard, node_id="${nodeId}")`);
    codeLines.push(`${indentLevel}    else:`);
    codeLines.push(`${indentLevel}        await bot.send_photo(${userIdSource}, image_url, caption=processed_caption${parseModeParam}, node_id="${nodeId}")`);

    // Автопереход если нужен и collectUserInput=true
    if (autoTransitionTo && collectUserInput) {
      const safeAutoTargetId = autoTransitionTo.replace(/[^a-zA-Z0-9_]/g, '_');
      codeLines.push(`${indentLevel}    `);
      codeLines.push(`${indentLevel}    # ⚡ Автопереход к узлу ${autoTransitionTo}`);
      codeLines.push(`${indentLevel}    logging.info(f"⚡ Автопереход от узла ${nodeId} к узлу ${autoTransitionTo}")`);
      codeLines.push(`${indentLevel}    # Создаём FakeCallbackQuery для совместимости с callback обработчиком`);
      codeLines.push(`${indentLevel}    class FakeCallbackQuery:`);
      codeLines.push(`${indentLevel}        def __init__(self, message, target_node_id):`);
      codeLines.push(`${indentLevel}            self.from_user = message.from_user`);
      codeLines.push(`${indentLevel}            self.chat = message.chat`);
      codeLines.push(`${indentLevel}            self.data = target_node_id`);
      codeLines.push(`${indentLevel}            self.message = message`);
      codeLines.push(`${indentLevel}    fake_callback = FakeCallbackQuery(${messageSource}, "${autoTransitionTo}")`);
      codeLines.push(`${indentLevel}    await handle_callback_${safeAutoTargetId}(fake_callback)`);
      codeLines.push(`${indentLevel}    logging.info(f"✅ Автопереход выполнен: ${nodeId} -> ${autoTransitionTo}")`);
      codeLines.push(`${indentLevel}    return`);
    }

    codeLines.push(`${indentLevel}except Exception as e:`);
    codeLines.push(`${indentLevel}    logging.error(f"Ошибка отправки статического изображения: {e}")`);
    codeLines.push(`${indentLevel}    # Fallback на обычное сообщение при ошибке`);
    const autoTransitionFlag = autoTransitionTo ? ', is_auto_transition=True' : '';
    // ИСПРАВЛЕНИЕ: Используем parse_mode=None если parseMode не указан или равен "none"
    let parseModeFallbackParam = '';
    if (parseMode && parseMode.trim() !== '' && parseMode.trim().toLowerCase() !== 'none') {
      parseModeFallbackParam = `, parse_mode=ParseMode.${parseMode.toUpperCase()}`;
    } else {
      parseModeFallbackParam = ', parse_mode=None';
    }
    // ИСПРАВЛЕНИЕ: Добавляем клавиатуру если она определена
    codeLines.push(`${indentLevel}    if keyboard is not None:`);
    codeLines.push(`${indentLevel}        await safe_edit_or_send(${messageSource}, text, node_id="${nodeId}", reply_markup=keyboard${autoTransitionFlag}${parseModeFallbackParam})`);
    codeLines.push(`${indentLevel}    else:`);
    codeLines.push(`${indentLevel}        await safe_edit_or_send(${messageSource}, text, node_id="${nodeId}"${autoTransitionFlag}${parseModeFallbackParam})`);
  } else {
    // Если статическое изображение не определено, проверяем есть ли динамические медиа
    // Если есть attachedMedia, не отправляем текст здесь - он отправится вместе с медиа ниже
    if (!attachedMedia || attachedMedia.length === 0) {
      // Устанавливаем состояние ожидания ввода если нужно
      if (collectUserInput && nodeData) {
        codeLines.push(`${indentLevel}# Устанавливаем состояние ожидания ввода для узла ${nodeId} (без изображения)`);
        if (nodeData && nodeData.data) {
          const waitingStateCode = generateWaitingStateCode(nodeData, indentLevel, userIdSource);
          const waitingStateLines = waitingStateCode.split('\n').filter(line => line.trim());
          codeLines.push(...waitingStateLines);
        }
        codeLines.push(`${indentLevel}logging.info(f"✅ Узел ${nodeId} настроен для сбора ввода (collectUserInput=true) после отправки текста")`);
      }

      codeLines.push(`${indentLevel}# Отправляем текстовое сообщение (без изображения)`);
      codeLines.push(`${indentLevel}await safe_edit_or_send(${messageSource}, text, node_id="${nodeId}", reply_markup=keyboard)`);

      // Автопереход если нужен и collectUserInput=true
      if (autoTransitionTo && collectUserInput) {
        const safeAutoTargetId = autoTransitionTo.replace(/[^a-zA-Z0-9_]/g, '_');
        codeLines.push(`${indentLevel}# ⚡ Автопереход к узлу ${autoTransitionTo}`);
        codeLines.push(`${indentLevel}logging.info(f"⚡ Автопереход от узла ${nodeId} к узлу ${autoTransitionTo}")`);
        codeLines.push(`${indentLevel}# Создаём FakeCallbackQuery для совместимости с callback обработчиком`);
        codeLines.push(`${indentLevel}class FakeCallbackQuery:`);
        codeLines.push(`${indentLevel}    def __init__(self, message, target_node_id):`);
        codeLines.push(`${indentLevel}        self.from_user = message.from_user`);
        codeLines.push(`${indentLevel}        self.chat = message.chat`);
        codeLines.push(`${indentLevel}        self.data = target_node_id`);
        codeLines.push(`${indentLevel}        self.message = message`);
        codeLines.push(`${indentLevel}fake_callback = FakeCallbackQuery(${messageSource}, "${autoTransitionTo}")`);
        codeLines.push(`${indentLevel}await handle_callback_${safeAutoTargetId}(fake_callback)`);
        codeLines.push(`${indentLevel}logging.info(f"✅ Автопереход выполнен: ${nodeId} -> ${autoTransitionTo}")`);
      }
    }
    // Если есть attachedMedia, код для их отправки будет сгенерирован ниже
  }

  // Если у нас дошли до сюда, значит статического изображения не было,
  // и мы обрабатываем динамические медиафайлы
  if (!attachedMedia || attachedMedia.length === 0) {
    // Применяем автоматическое добавление комментариев ко всему коду
    const processedCode = processCodeWithAutoComments(codeLines, 'generateAttachedMediaSendCode.ts');
    return processedCode.join('\n');
  }

  // Убедимся, что переменная keyboardHTML определена
  codeLines.push(`${indentLevel}keyboardHTML = locals().get('keyboardHTML', None) or globals().get('keyboardHTML', None) or None`);

  // Находим первую переменную из attachedMedia, которая также присутствует в mediaVariablesMap
  // ИСПРАВЛЕНИЕ: Перебираем все переменные и пропускаем те, что равны "undefined"
  let mediaInfo = null;
  let mediaVariable = null;
  let mediaType = null;

  for (const mediaVar of attachedMedia) {
    // Пропускаем переменные со значением "undefined"
    if (mediaVar === 'undefined' || mediaVar.startsWith('undefined')) {
      continue;
    }
    
    if (mediaVariablesMap.has(mediaVar)) {
      const info = mediaVariablesMap.get(mediaVar);
      if (info) {
        mediaInfo = info;
        mediaVariable = mediaVar;
        mediaType = info.type;
        break; // Используем первую найденную валидную переменную
      }
    }
  }

  // Если не найдена ни одна переменная из тех, что есть в mediaVariablesMap,
  // проверим, есть ли вообще какие-то переменные в mediaVariablesMap, соответствующие этому узлу
  if (!mediaInfo || !mediaVariable || !mediaType) {
    // Перебираем все переменные в mediaVariablesMap, чтобы найти те, которые относятся к текущему узлу
    for (const [mapVar, info] of mediaVariablesMap.entries()) {
      if (mapVar.endsWith('_' + nodeId)) { // Проверяем, относится ли переменная к текущему узлу (например, video_url_start для узла start)
        mediaInfo = info;
        mediaVariable = mapVar;
        mediaType = info.type;
        break;
      }
    }

    if (!mediaInfo || !mediaVariable || !mediaType) {
      if (isLoggingEnabled()) isLoggingEnabled() && console.log(`⚠️ ГЕНЕРАТОР: Ни одна из медиапеременных ${attachedMedia.join(', ')} не найдена в mediaVariablesMap`);
      // Применяем автоматическое добавление комментариев ко всему коду
      const processedCode = processCodeWithAutoComments(codeLines, 'generateAttachedMediaSendCode.ts');
      return processedCode.join('\n');
    }
  }

  codeLines.push(`${indentLevel}# Проверяем наличие прикрепленного медиа из переменной ${mediaVariable}`);
  codeLines.push(`${indentLevel}attached_media = None`);

  // Создаем объединенный словарь переменных из базы данных и локального хранилища
  codeLines.push(`${indentLevel}# Создаем объединенный словарь переменных из базы данных и локального хранилища`);
  codeLines.push(`${indentLevel}user_id = ${userIdSource}`);
  codeLines.push(`${indentLevel}all_user_vars = {}`);
  codeLines.push(`${indentLevel}# Добавляем переменные из базы данных`);
  codeLines.push(`${indentLevel}user_vars = await get_user_from_db(user_id)`);
  codeLines.push(`${indentLevel}if user_vars and isinstance(user_vars, dict):`);
  codeLines.push(`${indentLevel}    all_user_vars.update(user_vars)`);
  codeLines.push(`${indentLevel}# Добавляем переменные из локального хранилища`);
  codeLines.push(`${indentLevel}local_user_vars = user_data.get(user_id, {})`);
  codeLines.push(`${indentLevel}if isinstance(local_user_vars, dict):`);
  codeLines.push(`${indentLevel}    all_user_vars.update(local_user_vars)`);
  codeLines.push(`${indentLevel}`);
  codeLines.push(`${indentLevel}# Проверяем наличие прикрепленного медиа из переменной ${mediaVariable} в объединенном словаре`);
  codeLines.push(`${indentLevel}attached_media = None`);
  codeLines.push(`${indentLevel}if "${mediaVariable}" in all_user_vars:`);
  codeLines.push(`${indentLevel}    media_data = all_user_vars["${mediaVariable}"]`);
  codeLines.push(`${indentLevel}    if isinstance(media_data, dict) and "value" in media_data:`);
  codeLines.push(`${indentLevel}        # ИСПРАВЛЕНИЕ: Проверяем правильные URL поля в зависимости от типа медиа`);
  codeLines.push(`${indentLevel}        # Для фото проверяем photoUrl`);
  codeLines.push(`${indentLevel}        if "${mediaType}" == "photo" and "photoUrl" in media_data and media_data["photoUrl"]:`);
  codeLines.push(`${indentLevel}            attached_media = media_data["photoUrl"]  # Используем URL вместо file_id`);
  codeLines.push(`${indentLevel}        # Для видео проверяем videoUrl`);
  codeLines.push(`${indentLevel}        elif "${mediaType}" == "video" and "videoUrl" in media_data and media_data["videoUrl"]:`);
  codeLines.push(`${indentLevel}            attached_media = media_data["videoUrl"]  # Используем URL вместо file_id`);
  codeLines.push(`${indentLevel}        # Для аудио проверяем audioUrl`);
  codeLines.push(`${indentLevel}        elif "${mediaType}" == "audio" and "audioUrl" in media_data and media_data["audioUrl"]:`);
  codeLines.push(`${indentLevel}            attached_media = media_data["audioUrl"]  # Используем URL вместо file_id`);
  codeLines.push(`${indentLevel}        # Для документов проверяем documentUrl`);
  codeLines.push(`${indentLevel}        elif "${mediaType}" == "document" and "documentUrl" in media_data and media_data["documentUrl"]:`);
  codeLines.push(`${indentLevel}            attached_media = media_data["documentUrl"]  # Используем URL вместо file_id`);
  codeLines.push(`${indentLevel}        else:`);
  codeLines.push(`${indentLevel}            attached_media = media_data["value"]  # Используем file_id только если URL недоступен`);
  codeLines.push(`${indentLevel}    elif isinstance(media_data, str):`);
  codeLines.push(`${indentLevel}        attached_media = media_data`);

  codeLines.push(`${indentLevel}`);

  // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Всегда устанавливаем состояние ожидания ввода для collectUserInput=true
  if (collectUserInput && nodeData) {
    codeLines.push(`${indentLevel}# КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Устанавливаем состояние ожидания ввода для узла ${nodeId}`);
    if (nodeData && nodeData.data) {
      const waitingStateCode = generateWaitingStateCode(nodeData, indentLevel, userIdSource);
      const waitingStateLines = waitingStateCode.split('\n').filter(line => line.trim());
      codeLines.push(...waitingStateLines);
    }
    codeLines.push(`${indentLevel}logging.info(f"✅ Узел ${nodeId} настроен для сбора ввода (collectUserInput=true) после отправки медиа")`);
  }

  codeLines.push(`${indentLevel}# Если медиа найдено, отправляем с медиа, иначе обычное сообщение`);
  codeLines.push(`${indentLevel}if attached_media and str(attached_media).strip():`);
  codeLines.push(`${indentLevel}    logging.info(f"📎 Отправка ${mediaType} медиа из переменной ${mediaVariable}: {attached_media}")`);
  codeLines.push(`${indentLevel}    try:`);
  codeLines.push(`${indentLevel}        # Заменяем переменные в тексте перед отправкой медиа`);
  codeLines.push(`${indentLevel}        # Используем all_user_vars вместо user_vars для корректной замены переменных`);
  codeLines.push(`${indentLevel}        processed_caption = replace_variables_in_text(text, all_user_vars)`);
  codeLines.push(`${indentLevel}        # Проверяем, является ли медиа относительным путем к локальному файлу`);
  codeLines.push(`${indentLevel}        if str(attached_media).startswith('/uploads/') or str(attached_media).startswith('/uploads\\\\') or '\\\\uploads\\\\' in str(attached_media):`);
  codeLines.push(`${indentLevel}            attached_media_path = get_upload_file_path(attached_media)`);
  codeLines.push(`${indentLevel}            attached_media_url = FSInputFile(attached_media_path)`);
  codeLines.push(`${indentLevel}        else:`);
  codeLines.push(`${indentLevel}            attached_media_url = attached_media`);
  codeLines.push(`${indentLevel}        # Убедимся, что переменные keyboard и keyboardHTML определены`);
  codeLines.push(`${indentLevel}        # ВАЖНО: Не затираем keyboard, если он уже существует (сгенерирован ранее)`);
  codeLines.push(`${indentLevel}        if 'keyboardHTML' not in locals():`);
  codeLines.push(`${indentLevel}            keyboardHTML = None`);
  const keyboardParam = keyboard !== 'None' ? ', reply_markup=keyboard' : '';
  // ИСПРАВЛЕНИЕ: Генерируем parse_mode только если parseMode не пустой и не равен "none"
  let parseModeParam = '';
  if (parseMode && parseMode.trim() !== '' && parseMode.trim().toLowerCase() !== 'none') {
    parseModeParam = `, parse_mode=ParseMode.${parseMode.toUpperCase()}`;
  }

  switch (mediaType) {
    case 'photo':
      codeLines.push(`${indentLevel}        await bot.send_photo(${userIdSource}, attached_media_url, caption=processed_caption${parseModeParam}${keyboardParam})`);
      break;
    case 'video':
      codeLines.push(`${indentLevel}        await bot.send_video(${userIdSource}, attached_media_url, caption=processed_caption${parseModeParam}${keyboardParam})`);
      break;
    case 'audio':
      codeLines.push(`${indentLevel}        await bot.send_audio(${userIdSource}, attached_media_url, caption=processed_caption${parseModeParam}${keyboardParam})`);
      break;
    case 'document':
      codeLines.push(`${indentLevel}        await bot.send_document(${userIdSource}, attached_media_url, caption=processed_caption${parseModeParam}${keyboardParam})`);
      break;
    default:
      codeLines.push(`${indentLevel}        # Неизвестный тип медиа: ${mediaType}, fallback на обычное сообщение`);
      const autoTransitionFlagDefault = autoTransitionTo ? ', is_auto_transition=True' : '';
      codeLines.push(`${indentLevel}        await safe_edit_or_send(${messageSource}, processed_caption, node_id="${nodeId}", reply_markup=${keyboard}${autoTransitionFlagDefault}${parseModeParam})`);
  }

  // АВТОПЕРЕХОД: Если у узла есть autoTransitionTo и collectUserInput=true, добавляем переход после отправки медиа
  if (autoTransitionTo && collectUserInput) {
    const safeAutoTargetId = autoTransitionTo.replace(/[^a-zA-Z0-9_]/g, '_');
    codeLines.push(`${indentLevel}        # ⚡ Автопереход к узлу ${autoTransitionTo}`);
    codeLines.push(`${indentLevel}        logging.info(f"⚡ Автопереход от узла ${nodeId} к узлу ${autoTransitionTo}")`);
    codeLines.push(`${indentLevel}        # Создаём FakeCallbackQuery для совместимости с callback обработчиком`);
    codeLines.push(`${indentLevel}        class FakeCallbackQuery:`);
    codeLines.push(`${indentLevel}            def __init__(self, message, target_node_id):`);
    codeLines.push(`${indentLevel}                self.from_user = message.from_user`);
    codeLines.push(`${indentLevel}                self.chat = message.chat`);
    codeLines.push(`${indentLevel}                self.data = target_node_id`);
    codeLines.push(`${indentLevel}                self.message = message`);
    codeLines.push(`${indentLevel}        fake_callback = FakeCallbackQuery(${messageSource}, "${autoTransitionTo}")`);
    codeLines.push(`${indentLevel}        await handle_callback_${safeAutoTargetId}(fake_callback)`);
    codeLines.push(`${indentLevel}        logging.info(f"✅ Автопереход выполнен: ${nodeId} -> ${autoTransitionTo}")`);
    codeLines.push(`${indentLevel}        return`);
  }

  codeLines.push(`${indentLevel}    except Exception as e:`);
  codeLines.push(`${indentLevel}        logging.error(f"Ошибка отправки ${mediaType}: {e}")`);
  codeLines.push(`${indentLevel}        # Fallback на обычное сообщение при ошибке`);
  codeLines.push(`${indentLevel}        # Убедимся, что переменная keyboardHTML определена`);
  codeLines.push(`${indentLevel}        if 'keyboardHTML' not in locals():`);
  codeLines.push(`${indentLevel}            keyboardHTML = None`);
  codeLines.push(`${indentLevel}        # Используем keyboard если keyboardHTML не определен`);
  codeLines.push(`${indentLevel}        reply_markup_to_use = keyboard if keyboard is not None else keyboardHTML`);
  const autoTransitionFlag = autoTransitionTo ? ', is_auto_transition=True' : '';
  // ИСПРАВЛЕНИЕ: Используем parse_mode=None если parseMode не указан или равен "none"
  let parseModeFallbackParam = '';
  if (parseMode && parseMode.trim() !== '' && parseMode.trim().toLowerCase() !== 'none') {
    parseModeFallbackParam = `, parse_mode=ParseMode.${parseMode.toUpperCase()}`;
  } else {
    parseModeFallbackParam = ', parse_mode=None';
  }
  codeLines.push(`${indentLevel}        await safe_edit_or_send(${messageSource}, text, node_id="${nodeId}", reply_markup=reply_markup_to_use${autoTransitionFlag}${parseModeFallbackParam})`);
  codeLines.push(`${indentLevel}else:`);
  codeLines.push(`${indentLevel}    # Медиа не найдено, отправляем обычное текстовое сообщение`);
  codeLines.push(`${indentLevel}    logging.info(f"📝 Медиа ${mediaVariable} не найдено, отправка текстового сообщения")`);
  codeLines.push(`${indentLevel}    # Заменяем переменные в тексте перед отправкой`);
  codeLines.push(`${indentLevel}    # Используем all_user_vars вместо user_vars для корректной замены переменных`);
  codeLines.push(`${indentLevel}    processed_text = replace_variables_in_text(text, all_user_vars)`);
  codeLines.push(`${indentLevel}    # Убедимся, что переменная keyboardHTML определена`);
  codeLines.push(`${indentLevel}    if 'keyboardHTML' not in locals():`);
  codeLines.push(`${indentLevel}        keyboardHTML = None`);
  codeLines.push(`${indentLevel}    # Отправляем сообщение с клавиатурой (используем keyboard если keyboardHTML не определен)`);
  codeLines.push(`${indentLevel}    reply_markup_to_use = keyboard if keyboard is not None else keyboardHTML`);
  // ИСПРАВЛЕНИЕ: Используем parse_mode=None если parseMode не указан или равен "none"
  let parseModeElseParam = '';
  if (parseMode && parseMode.trim() !== '' && parseMode.trim().toLowerCase() !== 'none') {
    parseModeElseParam = `, parse_mode=ParseMode.${parseMode.toUpperCase()}`;
  } else {
    parseModeElseParam = ', parse_mode=None';
  }
  codeLines.push(`${indentLevel}    await safe_edit_or_send(${messageSource}, processed_text, node_id="${nodeId}", reply_markup=reply_markup_to_use${autoTransitionFlag}${parseModeElseParam})`);
  codeLines.push(''); // Пустая строка для разделения кода

  // Применяем автоматическое добавление комментариев ко всему коду
  const processedCode = processCodeWithAutoComments(codeLines, 'generateAttachedMediaSendCode.ts');
  return processedCode.join('\n');
}