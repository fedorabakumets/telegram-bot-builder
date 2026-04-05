/**
 * @fileoverview Схема узла бота
 * @module shared/schema/tables/node-schema
 */

import { z } from "zod";
import { buttonSchema } from "./button-schema";

const forwardMessageTargetRecipientSchema = z.object({
  /** Уникальный ID получателя внутри узла */
  id: z.string(),
  /** Источник ID чата назначения: "manual", "variable", "admin_ids" */
  targetChatIdSource: z.enum(['manual', 'variable', 'admin_ids']).default('manual'),
  /** ID или username чата */
  targetChatId: z.string().optional(),
  /** Имя переменной с ID чата */
  targetChatVariableName: z.string().optional(),
  /** Тип получателя: "user" — пользователь, "group" — группа или канал */
  targetChatType: z.enum(['user', 'group']).optional(),
  /** ID топика (message_thread_id) для форум-групп */
  targetThreadId: z.string().optional(),
});

/** Схема узла бота */
export const nodeSchema = z.object({
  /** Уникальный идентификатор узла */
  id: z.string(),
  /** Тип узла: "start", "message", "command", "command_trigger", "text_trigger", "sticker", "voice" и др. */
  /**
   * @deprecated Canonical content node is `message`.
   * `start` and `command` are kept only for backward compatibility with legacy projects.
   */
  type: z.enum(['start', 'message', 'command', 'command_trigger', 'text_trigger', 'incoming_message_trigger', 'incoming_callback_trigger', 'outgoing_message_trigger', 'group_message_trigger', 'callback_trigger', 'managed_bot_updated_trigger', 'sticker', 'voice', 'animation', 'location', 'contact', 'pin_message', 'unpin_message', 'delete_message', 'forward_message', 'ban_user', 'unban_user', 'mute_user', 'unmute_user', 'kick_user', 'promote_user', 'demote_user', 'admin_rights', 'photo', 'video', 'audio', 'document', 'keyboard', 'input', 'condition', 'broadcast', 'client_auth', 'media', 'create_forum_topic', 'http_request']),
  /** Позиция узла на холсте */
  position: z.object({
    /** Координата X */
    x: z.number(),
    /** Координата Y */
    y: z.number(),
  }),
  /** Данные узла */
  data: z.object({
    /** Текст команды, например "/start" или "/help" */
    /** @deprecated Legacy command text for `start`/`command` nodes. New projects should use `command_trigger`. */
    command: z.string().optional(),
    /** Описание команды для отображения в меню BotFather */
    description: z.string().optional(),
    /** Текст сообщения, отправляемого пользователю */
    messageText: z.string().optional(),
    /** URL изображения для прикрепления к сообщению */
    imageUrl: z.string().optional(),
    /** URL видео для прикрепления к сообщению */
    videoUrl: z.string().optional(),
    /** URL аудио для прикрепления к сообщению */
    audioUrl: z.string().optional(),
    /** URL документа для прикрепления к сообщению */
    documentUrl: z.string().optional(),
    /** Имя файла документа */
    documentName: z.string().optional(),
    /** Подпись к медиафайлу */
    mediaCaption: z.string().optional(),
    /** Тип клавиатуры: "reply" — reply-клавиатура, "inline" — inline-кнопки, "none" — без клавиатуры */
    keyboardType: z.enum(['reply', 'inline', 'none']).default('none'),
    /** Массив кнопок клавиатуры */
    buttons: z.array(buttonSchema).default([]),
    /** Настройки макета клавиатуры */
    keyboardLayout: z.object({
      /** Строки клавиатуры с ID кнопок */
      rows: z.array(z.object({
        /** Идентификаторы кнопок в строке */
        buttonIds: z.array(z.string()),
      })).default([]),
      /** Количество колонок при авто-раскладке (1–6) */
      columns: z.number().min(1).max(6).default(2),
      /** Использовать автоматическую раскладку */
      autoLayout: z.boolean().default(true),
    }).optional(),
    /** Скрывать клавиатуру после одного нажатия */
    oneTimeKeyboard: z.boolean().default(false),
    /** Подстраивать размер клавиатуры под экран */
    resizeKeyboard: z.boolean().default(true),
    /** Использовать Markdown-форматирование (устаревшее, используйте formatMode) */
    markdown: z.boolean().default(false),
    /** Режим форматирования текста: "html", "markdown", "none" */
    formatMode: z.enum(['html', 'markdown', 'none']).default('none'),
    /**
     * @deprecated Синонимы команды — устаревшее поле.
     * Вместо синонимов используйте отдельные узлы command_trigger на холсте.
     */
    synonyms: z.array(z.string()).default([]),
    /**
     * @deprecated Режим совпадения синонимов — устаревшее поле.
     * Используется только совместно с устаревшим полем synonyms.
     */
    matchMode: z.enum(['exact', 'contains', 'fuzzy']).default('exact').optional(),
    /** Доступна только администраторам */
    adminOnly: z.boolean().default(false),
    /** Требуется авторизация пользователя */
    requiresAuth: z.boolean().default(false),
    /** Показывать команду в меню бота */
    showInMenu: z.boolean().default(true),
    /** Таймаут выполнения команды в секундах */
    commandTimeout: z.number().optional(),
    /** Время задержки между повторными вызовами в секундах */
    cooldownTime: z.number().optional(),
    /** Максимальное количество использований в день */
    maxUsagesPerDay: z.number().optional(),
    /** Включить сбор статистики использования */
    enableStatistics: z.boolean().default(true),
    /** Пользовательские параметры команды */
    customParameters: z.array(z.string()).default([]),
    /** ID целевого сообщения для операций с сообщениями */
    targetMessageId: z.string().optional(),
    /** ID сообщения-источника для пересылки */
    sourceMessageId: z.string().optional(),
    /** Источник ID сообщения: "manual" — вручную, "variable" — из переменной, "last_message" — последнее */
    messageIdSource: z.enum(['manual', 'variable', 'last_message']).default('last_message'),
    /** Источник ID сообщения для пересылки: "current_message", "last_message", "manual", "variable" */
    sourceMessageIdSource: z.enum(['current_message', 'last_message', 'manual', 'variable']).default('current_message'),
    /** ID узла, от которого пришла связь к forward_message */
    sourceMessageNodeId: z.string().optional(),
    /** Имя переменной с ID сообщения-источника */
    sourceMessageVariableName: z.string().optional(),
    /** Имя переменной для хранения данных */
    variableName: z.string().optional(),
    /** Отключить уведомление при закреплении/откреплении сообщения */
    disableNotification: z.boolean().default(false),
    /** Скрыть автора при пересылке — использует copy_message вместо forward_message */
    hideAuthor: z.boolean().default(false),
    /** ID чата назначения для пересылки сообщения */
    targetChatId: z.string().optional(),
    /** Источник ID чата назначения: "manual", "variable", "admin_ids" */
    targetChatIdSource: z.enum(['manual', 'variable', 'admin_ids']).default('manual'),
    /** Имя переменной с ID чата назначения */
    targetChatVariableName: z.string().optional(),
    /** Несколько получателей для пересылки сообщения */
    targetChatTargets: z.array(forwardMessageTargetRecipientSchema).default([]),
    /** ID топика для legacy-поля первого получателя */
    targetThreadId: z.string().optional(),
    /** Источник ID топика: "manual" или "variable" */
    targetThreadIdSource: z.enum(['manual', 'variable']).optional(),
    /** Имя переменной с ID топика */
    targetThreadIdVariable: z.string().optional(),
    /** ID целевого пользователя для операций с пользователями */
    targetUserId: z.string().optional(),
    /** Источник ID пользователя: "manual" — вручную, "variable" — из переменной, "last_message" — из последнего сообщения */
    userIdSource: z.enum(['manual', 'variable', 'last_message']).default('last_message'),
    /** Имя переменной с ID пользователя */
    userVariableName: z.string().optional(),
    /** ID целевой группы */
    targetGroupId: z.string().optional(),
    /** URL стикера */
    stickerUrl: z.string().optional(),
    /** File ID стикера в Telegram */
    stickerFileId: z.string().optional(),
    /** URL голосового сообщения */
    voiceUrl: z.string().optional(),
    /** URL GIF-анимации */
    animationUrl: z.string().optional(),
    /** Широта для геолокации */
    latitude: z.number().optional(),
    /** Долгота для геолокации */
    longitude: z.number().optional(),
    /** Название места */
    title: z.string().optional(),
    /** Адрес места */
    address: z.string().optional(),
    /** Foursquare ID места */
    foursquareId: z.string().optional(),
    /** Тип места в Foursquare */
    foursquareType: z.string().optional(),
    /** Картографический сервис: "yandex", "google", "2gis", "custom" */
    mapService: z.enum(['yandex', 'google', '2gis', 'custom']).default('custom'),
    /** URL карты Яндекс */
    yandexMapUrl: z.string().optional(),
    /** URL карты Google */
    googleMapUrl: z.string().optional(),
    /** URL карты 2GIS */
    gisMapUrl: z.string().optional(),
    /** Уровень масштабирования карты (1–20) */
    mapZoom: z.number().min(1).max(20).default(15),
    /** Показывать маршрут до места */
    showDirections: z.boolean().default(false),
    /** Генерировать превью карты */
    generateMapPreview: z.boolean().default(true),
    /** Номер телефона для контакта */
    phoneNumber: z.string().optional(),
    /** Имя контакта */
    firstName: z.string().optional(),
    /** Фамилия контакта */
    lastName: z.string().optional(),
    /** Telegram ID пользователя */
    userId: z.number().optional(),
    /** vCard контакта */
    vcard: z.string().optional(),
    /** Вопрос для опроса */
    question: z.string().optional(),
    /** Варианты ответов для опроса */
    options: z.array(z.string()).default([]),
    /** Разрешить несколько ответов в опросе */
    allowsMultipleAnswers: z.boolean().default(false),
    /** Анонимное голосование */
    anonymousVoting: z.boolean().default(true),
    /** Эмодзи для кубика */
    emoji: z.string().optional(),
    /** Длительность медиафайла в секундах */
    mediaDuration: z.number().optional(),
    /** Ширина медиафайла в пикселях */
    width: z.number().optional(),
    /** Высота медиафайла в пикселях */
    height: z.number().optional(),
    /** Исполнитель аудиофайла */
    performer: z.string().optional(),
    /** Размер файла в байтах */
    fileSize: z.number().optional(),
    /** Имя файла */
    filename: z.string().optional(),
    /** Тип ожидаемого ввода: "text", "number", "email", "phone", "photo", "video", "audio", "document", "location", "contact", "any" */
    inputType: z.enum(['text', 'number', 'email', 'phone', 'photo', 'video', 'audio', 'document', 'location', 'contact', 'any']).default('text'),
    /** Тип ответа пользователя: "text" — текст, "buttons" — кнопки */
    responseType: z.enum(['text', 'buttons']).default('text'),
    /** Варианты ответов с кнопками */
    responseOptions: z.array(z.object({
      /** Уникальный идентификатор варианта */
      id: z.string(),
      /** Текст кнопки */
      text: z.string(),
      /** Значение варианта */
      value: z.string().optional(),
      /** Действие при выборе: "goto", "command", "url" */
      action: z.enum(['goto', 'command', 'url']).default('goto'),
      /** Целевой узел или команда */
      target: z.string().optional(),
      /** URL для перехода */
      url: z.string().optional()
    })).default([]),
    /** Разрешить множественный выбор */
    allowMultipleSelection: z.boolean().default(false),
    /** Имя переменной для хранения множественного выбора */
    multiSelectVariable: z.string().optional(),
    /** Текст кнопки продолжения */
    continueButtonText: z.string().optional(),
    /** Целевой узел кнопки продолжения */
    continueButtonTarget: z.string().optional(),
    /** Имя переменной для сохранения ввода пользователя */
    inputVariable: z.string().optional(),
    /** Подсказка для ввода пользователя */
    inputPrompt: z.string().optional(),
    /** Регулярное выражение для валидации ввода */
    inputValidation: z.string().optional(),
    /** Ввод обязателен */
    inputRequired: z.boolean().default(true),
    /** Таймаут ожидания ввода в секундах */
    inputTimeout: z.number().optional(),
    /** Сообщение при неверном вводе */
    inputRetryMessage: z.string().optional(),
    /** Сообщение при успешном вводе */
    inputSuccessMessage: z.string().optional(),
    /** Включить условные сообщения */
    enableConditionalMessages: z.boolean().default(false),
    /** Массив условных сообщений */
    conditionalMessages: z.array(z.object({
      /** Уникальный идентификатор условия */
      id: z.string(),
      /** Тип условия: "user_data_exists", "user_data_equals", "user_data_not_exists", "user_data_contains", "first_time", "returning_user" */
      condition: z.enum(['user_data_exists', 'user_data_equals', 'user_data_not_exists', 'user_data_contains', 'first_time', 'returning_user']).default('user_data_exists'),
      /** Имя переменной для проверки */
      variableName: z.string().optional(),
      /** Список имён переменных для проверки */
      variableNames: z.array(z.string()).default([]),
      /** Логический оператор для нескольких условий: "AND", "OR" */
      logicOperator: z.enum(['AND', 'OR']).default('AND'),
      /** Ожидаемое значение переменной */
      expectedValue: z.string().optional(),
      /** Текст условного сообщения */
      messageText: z.string(),
      /** Режим форматирования условного сообщения: "text", "markdown", "html" */
      formatMode: z.enum(['text', 'markdown', 'html']).default('text'),
      /** Тип клавиатуры условного сообщения: "reply", "inline", "none" */
      keyboardType: z.enum(['reply', 'inline', 'none']).default('none'),
      /** Кнопки условного сообщения */
      buttons: z.array(buttonSchema).default([]),
      /** Подстраивать размер клавиатуры */
      resizeKeyboard: z.boolean().default(true).optional(),
      /** Скрывать клавиатуру после нажатия */
      oneTimeKeyboard: z.boolean().default(false).optional(),
      /** Ожидать ввод пользователя после условного сообщения */
      collectUserInput: z.boolean().default(false),
      /** Принимать текстовый ввод */
      enableTextInput: z.boolean().default(false),
      /** Принимать фото */
      enablePhotoInput: z.boolean().default(false),
      /** Принимать видео */
      enableVideoInput: z.boolean().default(false),
      /** Принимать аудио */
      enableAudioInput: z.boolean().default(false),
      /** Принимать документы */
      enableDocumentInput: z.boolean().default(false),
      /** Переменная для текстового ввода */
      inputVariable: z.string().optional(),
      /** Переменная для фото */
      photoInputVariable: z.string().optional(),
      /** Переменная для видео */
      videoInputVariable: z.string().optional(),
      /** Переменная для аудио */
      audioInputVariable: z.string().optional(),
      /** Переменная для документа */
      documentInputVariable: z.string().optional(),
      /** Ожидать текстовый ввод */
      waitForTextInput: z.boolean().default(false),
      /** Переменная для хранения текстового ввода */
      textInputVariable: z.string().optional(),
      /** Следующий узел после получения ввода */
      nextNodeAfterInput: z.string().optional(),
      /** Приоритет условия (чем выше, тем раньше проверяется) */
      priority: z.number().default(0)
    })).default([]),
    /** Запасное сообщение, если ни одно условие не выполнено */
    fallbackMessage: z.string().optional(),
    /** Сохранять ввод пользователя в базу данных */
    saveToDatabase: z.boolean().default(false),
    /** Разрешить пропустить ввод */
    allowSkip: z.boolean().default(false),
    /** Ожидать ввод пользователя */
    collectUserInput: z.boolean().default(false),
    /** ID узла, который получит ввод пользователя */
    inputTargetNodeId: z.string().optional(),
    /** Тип кнопки для ввода: "inline", "reply" */
    inputButtonType: z.enum(['inline', 'reply']).default('inline'),
    /** Включить автоматический переход на следующий узел */
    enableAutoTransition: z.boolean().default(false),
    /** ID узла для автоматического перехода */
    autoTransitionTo: z.string().optional(),
    /** @deprecated Stable link to the originating node for legacy/compatibility flows. Use `autoTransitionTo` for execution flow, `sourceNodeId` for identity. */
    sourceNodeId: z.string().optional(),
    /** Минимальная длина текстового ввода */
    minLength: z.number().optional(),
    /** Максимальная длина текстового ввода */
    maxLength: z.number().optional(),
    /** Placeholder для поля ввода */
    placeholder: z.string().optional(),
    /** Значение по умолчанию */
    defaultValue: z.string().optional(),
    /** Добавлять значение к существующей переменной, а не перезаписывать */
    appendVariable: z.boolean().default(false),
    /** Фильтры переменных (ключ — имя переменной, значение — фильтр) */
    variableFilters: z.record(z.string()).default({}),
    /** Включить обработку действий пользователей */
    enableUserActions: z.boolean().default(false),
    /** Триггер действия: "join", "leave", "message", "button_click", "custom" */
    actionTrigger: z.enum(['join', 'leave', 'message', 'button_click', 'custom']).optional(),
    /** Текст для триггера типа "custom" */
    triggerText: z.string().optional(),
    /** Тип действия пользователя: "message", "command", "button", "media" */
    userActionType: z.enum(['message', 'command', 'button', 'media']).optional(),
    /** Тег действия для группировки */
    actionTag: z.string().optional(),
    /** Сообщение при выполнении действия */
    actionMessage: z.string().optional(),
    /** Выполнять действие без уведомления */
    silentAction: z.boolean().default(false),
    /** MIME-тип файла */
    mimeType: z.string().optional(),
    /** Название набора стикеров */
    stickerSetName: z.string().optional(),
    /** Имя файла */
    fileName: z.string().optional(),
    /** Город */
    city: z.string().optional(),
    /** Страна */
    country: z.string().optional(),
    /** Принимать текстовый ввод (верхний уровень) */
    enableTextInput: z.boolean().optional(),
    /** Принимать фото (верхний уровень) */
    enablePhotoInput: z.boolean().optional(),
    /** Принимать видео (верхний уровень) */
    enableVideoInput: z.boolean().optional(),
    /** Принимать аудио (верхний уровень) */
    enableAudioInput: z.boolean().optional(),
    /** Принимать документы (верхний уровень) */
    enableDocumentInput: z.boolean().optional(),
    /** Переменная для фото (верхний уровень) */
    photoInputVariable: z.string().optional(),
    /** Переменная для видео (верхний уровень) */
    videoInputVariable: z.string().optional(),
    /** Переменная для аудио (верхний уровень) */
    audioInputVariable: z.string().optional(),
    /** Переменная для документа (верхний уровень) */
    documentInputVariable: z.string().optional(),
    /** Имя узла или элемента */
    name: z.string().optional(),
    /** Метка для отображения */
    label: z.string().optional(),
    /** Символ галочки для выбранных элементов */
    checkmarkSymbol: z.string().optional(),
    /** Символ галочки для множественного выбора */
    multiSelectCheckmark: z.string().optional(),
    /** Длительность ограничения в секундах (для mute_user) */
    duration: z.number().optional(),
    /** Длительность мута в секундах */
    muteDuration: z.number().optional(),
    /** Причина действия (бан, мут, кик) */
    reason: z.string().optional(),
    /** Право изменять информацию группы */
    canChangeInfo: z.boolean().default(false),
    /** Право удалять сообщения */
    canDeleteMessages: z.boolean().default(false),
    /** Право банить пользователей */
    canBanUsers: z.boolean().default(false),
    /** Право приглашать пользователей */
    canInviteUsers: z.boolean().default(false),
    /** Право закреплять сообщения */
    canPinMessages: z.boolean().default(false),
    /** Право добавлять администраторов */
    canAddAdmins: z.boolean().default(false),
    /** Право ограничивать участников */
    canRestrictMembers: z.boolean().default(false),
    /** Право повышать участников */
    canPromoteMembers: z.boolean().default(false),
    /** Право управлять видеочатами */
    canManageVideoChats: z.boolean().default(false),
    /** Право управлять темами */
    canManageTopics: z.boolean().default(false),
    /** Администратор анонимен */
    isAnonymous: z.boolean().default(false),
    /** Разрешить отправку сообщений (для mute_user) */
    canSendMessages: z.boolean().default(true),
    /** Разрешить отправку медиа (для mute_user) */
    canSendMediaMessages: z.boolean().default(true),
    /** Разрешить отправку опросов (для mute_user) */
    canSendPolls: z.boolean().default(true),
    /** Разрешить отправку других сообщений (для mute_user) */
    canSendOtherMessages: z.boolean().default(true),
    /** Разрешить добавление превью ссылок (для mute_user) */
    canAddWebPagePreviews: z.boolean().default(true),
    /** Разрешить изменение информации группы (для mute_user) */
    canChangeGroupInfo: z.boolean().default(true),
    /** Разрешить приглашать пользователей (для mute_user, дубль) */
    canInviteUsers2: z.boolean().default(true),
    /** Разрешить закреплять сообщения (для mute_user, дубль) */
    canPinMessages2: z.boolean().default(true),
    /** Дата окончания бана (Unix timestamp, 0 — навсегда) */
    untilDate: z.number().optional(),
    /** ID пользователя для управления правами администратора */
    adminTargetUserId: z.string().optional(),
    /** Источник ID администратора: "manual", "variable", "last_message" */
    adminUserIdSource: z.enum(['manual', 'variable', 'last_message']).default('last_message'),
    /** Имя переменной с ID администратора */
    adminUserVariableName: z.string().optional(),
    /** Право управлять чатом (admin_rights) */
    can_manage_chat: z.boolean().default(false),
    /** Право публиковать сообщения (admin_rights) */
    can_post_messages: z.boolean().default(false),
    /** Право редактировать сообщения (admin_rights) */
    can_edit_messages: z.boolean().default(false),
    /** Право удалять сообщения (admin_rights) */
    can_delete_messages: z.boolean().default(false),
    /** Право публиковать истории (admin_rights) */
    can_post_stories: z.boolean().default(false),
    /** Право редактировать истории (admin_rights) */
    can_edit_stories: z.boolean().default(false),
    /** Право удалять истории (admin_rights) */
    can_delete_stories: z.boolean().default(false),
    /** Право управлять видеочатами (admin_rights) */
    can_manage_video_chats: z.boolean().default(false),
    /** Право ограничивать участников (admin_rights) */
    can_restrict_members: z.boolean().default(false),
    /** Право повышать участников (admin_rights) */
    can_promote_members: z.boolean().default(false),
    /** Право изменять информацию (admin_rights) */
    can_change_info: z.boolean().default(false),
    /** Право приглашать пользователей (admin_rights) */
    can_invite_users: z.boolean().default(false),
    /** Право закреплять сообщения (admin_rights) */
    can_pin_messages: z.boolean().default(false),
    /** Право управлять темами (admin_rights) */
    can_manage_topics: z.boolean().default(false),
    /** Администратор анонимен (admin_rights) */
    is_anonymous: z.boolean().default(false),
    /** ID чата для управления правами */
    adminChatId: z.string().optional(),
    /** Источник ID чата: "manual", "variable", "current_chat" */
    adminChatIdSource: z.enum(['manual', 'variable', 'current_chat']).default('current_chat'),
    /** Имя переменной с ID чата */
    adminChatVariableName: z.string().optional(),
    /** Массив URL прикреплённых медиафайлов */
    attachedMedia: z.array(z.string()).default([]),
    /** Произвольный текст (используется в некоторых узлах) */
    text: z.string().optional(),
    /** Действие узла (используется в некоторых узлах) */
    action: z.string().optional(),
    /** Ожидать текстовый ввод (устаревшее, используйте enableTextInput) */
    waitForTextInput: z.boolean().optional(),
    /** Источник ID пользователей для рассылки: "user_ids", "bot_users", "both" */
    idSourceType: z.enum(['user_ids', 'bot_users', 'both']).default('bot_users').optional(),
    /** Тип API для рассылки: "bot" — через бота, "client" — через клиент */
    broadcastApiType: z.enum(['bot', 'client']).default('bot').optional(),
    /** ID узла с контентом рассылки */
    broadcastTargetNode: z.string().optional(),
    /** Включить рассылку */
    enableBroadcast: z.boolean().default(false).optional(),
    /** Запрашивать подтверждение перед рассылкой */
    enableConfirmation: z.boolean().default(false).optional(),
    /** Текст запроса подтверждения */
    confirmationText: z.string().optional(),
    /** Сообщение об успешной рассылке */
    successMessage: z.string().optional(),
    /** Сообщение об ошибке рассылки */
    errorMessage: z.string().optional(),
    /** Имя сессии для client_auth */
    sessionName: z.string().default('user_session').optional(),
    /** Сессия создана */
    sessionCreated: z.boolean().default(false).optional(),
    /** Список текстов для текстового триггера */
    textSynonyms: z.array(z.string()).default([]),
    /** Режим совпадения текстового триггера: "exact" — точное, "contains" — содержит */
    textMatchType: z.enum(['exact', 'contains']).default('exact'),
    /** Переменная для проверки в узле условия, например "{{user_name}}" */
    variable: z.string().optional(),
    /** ID форум-группы для создания топика */
    forumChatId: z.string().optional(),
    /** Источник ID чата: "manual" — вручную, "variable" — из переменной */
    forumChatIdSource: z.enum(['manual', 'variable']).default('manual'),
    /** Имя переменной с ID форум-группы */
    forumChatVariableName: z.string().optional(),
    /** Название создаваемого топика, поддерживает {переменные} */
    topicName: z.string().optional(),
    /** Цвет иконки топика (числовое значение цвета Telegram) */
    topicIconColor: z.string().optional(),
    /** Имя переменной для сохранения thread_id созданного топика */
    saveThreadIdTo: z.string().optional(),
    /** Переменная для сохранения bot.id управляемого бота */
    saveBotIdTo: z.string().optional(),
    /** Переменная для сохранения bot.username управляемого бота */
    saveBotUsernameTo: z.string().optional(),
    /** Переменная для сохранения bot.first_name управляемого бота */
    saveBotNameTo: z.string().optional(),
    /** Переменная для сохранения user.id создателя бота */
    saveCreatorIdTo: z.string().optional(),
    /** Переменная для сохранения user.username создателя бота */
    saveCreatorUsernameTo: z.string().optional(),
    /** Фильтр по user.id — реагировать только на конкретного пользователя */
    filterByUserId: z.string().optional(),
    /** Не создавать топик повторно, если переменная saveThreadIdTo уже заполнена */
    skipIfExists: z.boolean().default(false),
    /** ID группы для триггера сообщения в группе */
    groupChatId: z.string().optional(),
    /** Источник ID группы: "manual" — вручную, "variable" — из переменной */
    groupChatIdSource: z.enum(['manual', 'variable']).optional(),
    /** Имя переменной с ID группы */
    groupChatVariableName: z.string().optional(),
    /** Имя переменной где у пользователей хранится thread_id */
    threadIdVariable: z.string().optional(),
    /** Имя переменной куда положить найденный user_id */
    resolvedUserIdVariable: z.string().optional(),
    /** Ветки узла условия */
    branches: z.array(z.object({
      /** Уникальный идентификатор ветки */
      id: z.string(),
      /** Отображаемое название ветки */
      label: z.string(),
      /** Оператор сравнения: "==", "!=", "contains", "else" */
      operator: z.enum([
        'filled',
        'empty',
        'equals',
        'contains',
        'greater_than',
        'less_than',
        'between',
        'is_private',
        'is_group',
        'is_channel',
        'is_admin',
        'is_premium',
        'is_bot',
        'is_subscribed',
        'is_not_subscribed',
        'else',
      ]),
      /** Значение для сравнения */
      value: z.string(),
      value2: z.string().optional(),
      /** ID целевого узла для перехода по этой ветке */
      target: z.string().optional(),
    })).default([]),
    /** Список получателей сообщения (для узлов message и media) */
    messageSendRecipients: z.array(z.object({
      /** Уникальный ID получателя */
      id: z.string(),
      /** Тип получателя: пользователь, по ID чата, администраторам */
      type: z.enum(['user', 'chat_id', 'admin_ids']).default('user'),
      /** ID чата или канала */
      chatId: z.string().optional(),
      /** ID топика в группе */
      threadId: z.string().optional(),
      /** Добавить префикс -100 для групп/каналов */
      isGroup: z.boolean().optional().default(false),
    })).optional().default([]),
    /** Целевой чат для отправки (legacy) */
    messageSendTarget: z.string().optional(),
    /** ID чата для отправки (legacy) */
    messageSendChatId: z.string().optional(),
    /** ID топика для отправки (legacy) */
    messageSendThreadId: z.string().optional(),
    /** URL для HTTP запроса, поддерживает переменные {var} */
    httpRequestUrl: z.string().optional(),
    /** HTTP метод: GET, POST, PUT, PATCH, DELETE */
    httpRequestMethod: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).default('GET').optional(),
    /** Заголовки запроса в формате JSON строки */
    httpRequestHeaders: z.string().optional(),
    /** Тело запроса в формате JSON строки */
    httpRequestBody: z.string().optional(),
    /** Таймаут запроса в секундах */
    httpRequestTimeout: z.number().default(30).optional(),
    /** Имя переменной для сохранения ответа */
    httpRequestResponseVariable: z.string().optional(),
    /** Имя переменной для сохранения HTTP статус кода */
    httpRequestStatusVariable: z.string().optional(),
  }),
});

/** Тип узла бота */
export type Node = z.infer<typeof nodeSchema>;
