import { isLoggingEnabled } from "../bot-generator";
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
  const hasStaticImage = nodeData && nodeData.imageUrl && nodeData.imageUrl.trim() !== '';
  
  // ИСПРАВЛЕНИЕ: Если есть статическое изображение, используем его напрямую
  if (hasStaticImage) {
    codeLines.push(`${indentLevel}# Узел содержит статическое изображение: ${nodeData.imageUrl}`);
    // Проверяем, является ли URL относительным путем к локальному файлу
    if (nodeData.imageUrl.startsWith('/uploads/')) {
      // Для локальных файлов используем FSInputFile для отправки напрямую с диска
      codeLines.push(`${indentLevel}static_image_path = get_upload_file_path("${nodeData.imageUrl}")`);
      codeLines.push(`${indentLevel}static_image_url = FSInputFile(static_image_path)`);
    } else {
      codeLines.push(`${indentLevel}static_image_url = "${nodeData.imageUrl}"`);
    }
    codeLines.push(`${indentLevel}`);
    
    // Устанавливаем состояние ожидания ввода если нужно
    if (collectUserInput && nodeData) {
      codeLines.push(`${indentLevel}# Устанавливаем состояние ожидания ввода для узла ${nodeId}`);
      const waitingStateCode = generateWaitingStateCode(nodeData, indentLevel, userIdSource);
      const waitingStateLines = waitingStateCode.split('\n').filter(line => line.trim());
      codeLines.push(...waitingStateLines);
      codeLines.push(`${indentLevel}logging.info(f"✅ Узел ${nodeId} настроен для сбора ввода (collectUserInput=true) после отправки изображения")`);
    }
    
    codeLines.push(`${indentLevel}# Отправляем статическое изображение`);
    codeLines.push(`${indentLevel}try:`);
    codeLines.push(`${indentLevel}    # Заменяем переменные в тексте перед отправкой`);
    codeLines.push(`${indentLevel}    processed_caption = replace_variables_in_text(text, user_vars)`);

    const keyboardParam = keyboard !== 'None' ? ', reply_markup=keyboard' : '';
    const parseModeParam = parseMode ? `, parse_mode=ParseMode.${parseMode.toUpperCase()}` : '';

    codeLines.push(`${indentLevel}    await bot.send_photo(${userIdSource}, static_image_url, caption=processed_caption${parseModeParam}${keyboardParam}, node_id="${nodeId}")`);

    // Автопереход если нужен
    if (autoTransitionTo) {
      codeLines.push(`${indentLevel}    `);
      codeLines.push(`${indentLevel}    # Проверяем, нужно ли выполнять автопереход`);
      codeLines.push(`${indentLevel}    if ${collectUserInput.toString()}:`);
      const safeAutoTargetId = autoTransitionTo.replace(/[^a-zA-Z0-9_]/g, '_');
      codeLines.push(`${indentLevel}        # ⚡ Автопереход к узлу ${autoTransitionTo}`);
      codeLines.push(`${indentLevel}        logging.info(f"⚡ Автопереход от узла ${nodeId} к узлу ${autoTransitionTo}")`);
      codeLines.push(`${indentLevel}        await handle_callback_${safeAutoTargetId}(${messageSource})`);
      codeLines.push(`${indentLevel}        logging.info(f"✅ Автопереход выполнен: ${nodeId} -> ${autoTransitionTo}")`);
      codeLines.push(`${indentLevel}        return`);
    }

    codeLines.push(`${indentLevel}except Exception as e:`);
    codeLines.push(`${indentLevel}    logging.error(f"Ошибка отправки статического изображения: {e}")`);
    codeLines.push(`${indentLevel}    # Fallback на обычное сообщение при ошибке`);
    const autoTransitionFlag = autoTransitionTo ? ', is_auto_transition=True' : '';
    codeLines.push(`${indentLevel}    await safe_edit_or_send(${messageSource}, text, node_id="${nodeId}", reply_markup=${keyboard}${autoTransitionFlag}${parseMode})`);
    
    // Применяем автоматическое добавление комментариев ко всему коду
    const processedCode = processCodeWithAutoComments(codeLines, 'generateAttachedMediaSendCode.ts');
    return processedCode.join('\n');
  }
  
  if (!attachedMedia || attachedMedia.length === 0) {
    return '';
  }

  // Находим первую переменную из attachedMedia, которая также присутствует в mediaVariablesMap
  let mediaInfo = null;
  let mediaVariable = null;
  let mediaType = null;

  for (const mediaVar of attachedMedia) {
    if (mediaVariablesMap.has(mediaVar)) {
      const info = mediaVariablesMap.get(mediaVar);
      if (info) {
        mediaInfo = info;
        mediaVariable = mediaVar;
        mediaType = info.type;
        break; // Используем первую найденную переменную
      }
    }
  }

  if (!mediaInfo || !mediaVariable || !mediaType) {
    if (isLoggingEnabled()) isLoggingEnabled() && console.log(`⚠️ ГЕНЕРАТОР: Ни одна из медиапеременных ${attachedMedia.join(', ')} не найдена в mediaVariablesMap`);
    return '';
  }

  codeLines.push(`${indentLevel}# Проверяем наличие прикрепленного медиа из переменной ${mediaVariable}`);
  codeLines.push(`${indentLevel}attached_media = None`);

  // Создаем объединенный словарь переменных из базы данных и локального хранилища
  codeLines.push(`${indentLevel}# Создаем объединенный словарь переменных из базы данных и локального хранилища`);
  codeLines.push(`${indentLevel}user_id = ${userIdSource}`);
  codeLines.push(`${indentLevel}all_user_vars = {}`);
  codeLines.push(`${indentLevel}# Добавляем переменные из базы данных`);
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
  codeLines.push(`${indentLevel}        attached_media = media_data["value"]`);
  codeLines.push(`${indentLevel}    elif isinstance(media_data, str):`);
  codeLines.push(`${indentLevel}        attached_media = media_data`);

  codeLines.push(`${indentLevel}`);
  
  // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Всегда устанавливаем состояние ожидания ввода для collectUserInput=true
  if (collectUserInput && nodeData) {
    codeLines.push(`${indentLevel}# КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Устанавливаем состояние ожидания ввода для узла ${nodeId}`);
    const waitingStateCode = generateWaitingStateCode(nodeData, indentLevel, userIdSource);
    const waitingStateLines = waitingStateCode.split('\n').filter(line => line.trim());
    codeLines.push(...waitingStateLines);
    codeLines.push(`${indentLevel}logging.info(f"✅ Узел ${nodeId} настроен для сбора ввода (collectUserInput=true) после отправки медиа")`);
  }

  codeLines.push(`${indentLevel}# Если медиа найдено, отправляем с медиа, иначе обычное сообщение`);
  codeLines.push(`${indentLevel}if attached_media and str(attached_media).strip():`);
  codeLines.push(`${indentLevel}    logging.info(f"📎 Отправка ${mediaType} медиа из переменной ${mediaVariable}: {attached_media}")`);
  codeLines.push(`${indentLevel}    try:`);
  codeLines.push(`${indentLevel}        # Заменяем переменные в тексте перед отправкой медиа`);
  codeLines.push(`${indentLevel}        processed_caption = replace_variables_in_text(text, user_vars)`);

  // Проверяем, является ли медиа относительным путем к локальному файлу и форматируем полный URL или используем FSInputFile
  codeLines.push(`${indentLevel}        # Проверяем, является ли медиа относительным путем к локальному файлу`);
  codeLines.push(`${indentLevel}        if str(attached_media).startswith('/uploads/'):`);
  codeLines.push(`${indentLevel}            attached_media_path = get_upload_file_path(attached_media)`);
  codeLines.push(`${indentLevel}            attached_media_url = FSInputFile(attached_media_path)`);
  codeLines.push(`${indentLevel}        else:`);
  codeLines.push(`${indentLevel}            attached_media_url = attached_media`);

  // Генерируем код отправки в зависимости от типа медиа
  // Убедимся, что переменные keyboard и keyboardHTML определены
  codeLines.push(`${indentLevel}        # Убедимся, что переменные клавиатуры определены`);
  codeLines.push(`${indentLevel}        if 'keyboard' not in locals():`);
  codeLines.push(`${indentLevel}            keyboard = None`);
  codeLines.push(`${indentLevel}        if 'keyboardHTML' not in locals():`);
  codeLines.push(`${indentLevel}            keyboardHTML = None`);

  const keyboardParam = keyboard !== 'None' ? ', reply_markup=keyboard' : '';
  const parseModeParam = parseMode ? `, parse_mode=ParseMode.${parseMode.toUpperCase()}` : '';

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
      codeLines.push(`${indentLevel}        await safe_edit_or_send(${messageSource}, processed_caption, node_id="${nodeId}", reply_markup=${keyboard}${autoTransitionFlagDefault}${parseMode})`);
  }

  // АВТОПЕРЕХОД: Если у узла есть autoTransitionTo, добавляем переход после отправки медиа
  if (autoTransitionTo) {
    codeLines.push(`${indentLevel}        `);
    codeLines.push(`${indentLevel}        # Проверяем, нужно ли выполнять автопереход - только если collectUserInput=true`);
    codeLines.push(`${indentLevel}        if ${collectUserInput.toString()}:  // Convert boolean to string representation`);
    const safeAutoTargetId = autoTransitionTo.replace(/[^a-zA-Z0-9_]/g, '_');
    codeLines.push(`${indentLevel}            # ⚡ Автопереход к узлу ${autoTransitionTo}`);
    codeLines.push(`${indentLevel}            logging.info(f"⚡ Автопереход от узла ${nodeId} к узлу ${autoTransitionTo}")`);
    codeLines.push(`${indentLevel}            await handle_callback_${safeAutoTargetId}(${messageSource})`);
    codeLines.push(`${indentLevel}            logging.info(f"✅ Автопереход выполнен: ${nodeId} -> ${autoTransitionTo}")`);
    codeLines.push(`${indentLevel}            return`);
    codeLines.push(`${indentLevel}        else:`);
    codeLines.push(`${indentLevel}            # Автопереход пропущен: collectUserInput=false`);
    codeLines.push(`${indentLevel}            logging.info(f"ℹ️ Узел ${nodeId} не собирает ответы (collectUserInput=false)")`);
  }

  codeLines.push(`${indentLevel}    except Exception as e:`);
  codeLines.push(`${indentLevel}        logging.error(f"Ошибка отправки ${mediaType}: {e}")`);
  codeLines.push(`${indentLevel}        # Fallback на обычное сообщение при ошибке`);
  codeLines.push(`${indentLevel}        # Убедимся, что переменные клавиатуры определены`);
  codeLines.push(`${indentLevel}        if 'keyboardHTML' not in locals():`);
  codeLines.push(`${indentLevel}            keyboardHTML = None`);
  const autoTransitionFlag = autoTransitionTo ? ', is_auto_transition=True' : '';
  codeLines.push(`${indentLevel}        await safe_edit_or_send(${messageSource}, text, node_id="${nodeId}", reply_markup=keyboardHTML${autoTransitionFlag}${parseModeParam})`);
  codeLines.push(`${indentLevel}else:`);
  codeLines.push(`${indentLevel}    # Медиа не найдено, отправляем обычное текстовое сообщение`);
  codeLines.push(`${indentLevel}    logging.info(f"📝 Медиа ${mediaVariable} не найдено, отправка текстового сообщения")`);
  codeLines.push(`${indentLevel}    # Заменяем переменные в тексте перед отправкой`);
  codeLines.push(`${indentLevel}    processed_text = replace_variables_in_text(text, user_vars)`);

  // ИСПРАВЛЕНИЕ: Если collectUserInput=true, отправляем сообщение и устанавливаем ожидание ввода, иначе просто отправляем сообщение
  codeLines.push(`${indentLevel}    # Убедимся, что переменные клавиатуры определены`);
  codeLines.push(`${indentLevel}    if 'keyboardHTML' not in locals():`);
  codeLines.push(`${indentLevel}        keyboardHTML = None`);
  codeLines.push(`${indentLevel}    # Отправляем сообщение независимо от collectUserInput`);
  codeLines.push(`${indentLevel}    await safe_edit_or_send(${messageSource}, processed_text, node_id="${nodeId}", reply_markup=keyboardHTML${autoTransitionFlag}${parseModeParam})`);
  codeLines.push(`${indentLevel}    if ${collectUserInput ? 'True' : 'False'}:`);
  codeLines.push(`${indentLevel}        # Устанавливаем состояние ожидания ввода`);
  codeLines.push(`${indentLevel}        logging.info(f"ℹ️ Узел ${nodeId} настроен на сбор ввода (collectUserInput=true)")`);

  // АВТОПЕРЕХОД: Если у узла есть autoTransitionTo, добавляем переход и для случая без медиа
  if (autoTransitionTo) {
    codeLines.push(`${indentLevel}    `);
    codeLines.push(`${indentLevel}    # Проверяем, нужно ли выполнять автопереход - только если collectUserInput=true`);
    codeLines.push(`${indentLevel}    if ${collectUserInput.toString()}:  // Convert boolean to string representation`);
    const safeAutoTargetId = autoTransitionTo.replace(/[^a-zA-Z0-9_]/g, '_');
    codeLines.push(`${indentLevel}        # ⚡ Автопереход к узлу ${autoTransitionTo}`);
    codeLines.push(`${indentLevel}        logging.info(f"⚡ Автопереход от узла ${nodeId} к узлу ${autoTransitionTo}")`);
    codeLines.push(`${indentLevel}        await handle_callback_${safeAutoTargetId}(${messageSource})`);
    codeLines.push(`${indentLevel}        logging.info(f"✅ Автопереход выполнен: ${nodeId} -> ${autoTransitionTo}")`);
    codeLines.push(`${indentLevel}        return`);
    codeLines.push(`${indentLevel}    else:`);
    codeLines.push(`${indentLevel}        # Автопереход пропущен: collectUserInput=false`);
    codeLines.push(`${indentLevel}        logging.info(f"ℹ️ Узел ${nodeId} не собирает ответы (collectUserInput=false)")`);
  }

  // Применяем автоматическое добавление комментариев ко всему коду
  const processedCode = processCodeWithAutoComments(codeLines, 'generateAttachedMediaSendCode.ts');
  return processedCode.join('\n');
}