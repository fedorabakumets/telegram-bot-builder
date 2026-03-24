/**
 * @fileoverview Объект данных узла по умолчанию для редактора бота.
 * Содержит все возможные поля узла с начальными значениями.
 * @module client/utils/sheets/default-node-data
 */

// Полный объект данных узла с типизацией, соответствующей схеме
export const defaultNodeData = {
  /** Текст сообщения бота */
  messageText: 'Привет! Я ваш новый бот. Нажмите /help для получения помощи.',
  /** Тип клавиатуры: "none", "inline", "reply" */
  keyboardType: 'none' as const,
  /** Массив кнопок */
  buttons: [],
  /** Автоматически подстраивать размер клавиатуры */
  resizeKeyboard: true,
  /** Скрывать клавиатуру после нажатия */
  oneTimeKeyboard: false,
  /** Включить Markdown-форматирование */
  markdown: false,
  /** Режим форматирования: "none", "markdown", "html" */
  formatMode: 'none' as const,
  /** Синонимы для команды */
  synonyms: [],
  /** Синонимы для текстового триггера */
  textSynonyms: [],
  /** Режим совпадения текстового триггера */
  textMatchType: 'exact' as const,
  /** Ветки условного узла */
  branches: [],
  /** Только для личных сообщений */
  isPrivateOnly: false,
  /** Только для администраторов */
  adminOnly: false,
  /** Требует авторизации */
  requiresAuth: false,
  /** Показывать в меню */
  showInMenu: true,
  /** Включить статистику */
  enableStatistics: true,
  /** Пользовательские параметры */
  customParameters: [],
  /** Варианты ответа */
  options: [],
  /** Команда бота (например, /start) */
  command: '/start',
  /** Описание команды */
  description: 'Запустить бота',
  /** URL изображения */
  imageUrl: '',
  /** URL видео */
  videoUrl: '',
  /** URL аудио */
  audioUrl: '',
  /** URL документа */
  documentUrl: '',
  /** Имя документа */
  documentName: '',
  /** Подпись к медиафайлу */
  mediaCaption: '',
  /** Таймаут команды в секундах */
  commandTimeout: undefined,
  /** Время перезарядки команды */
  cooldownTime: undefined,
  /** Максимум использований в день */
  maxUsagesPerDay: undefined,
  /** ID целевого сообщения */
  targetMessageId: undefined,
  /** Источник ID сообщения: "last_message", "variable" */
  messageIdSource: 'last_message' as const,
  /** Имя переменной */
  variableName: undefined,
  /** Отключить уведомление */
  disableNotification: false,
  /** ID целевого пользователя */
  targetUserId: undefined,
  /** Источник ID пользователя: "last_message", "variable" */
  userIdSource: 'last_message' as const,
  /** Имя переменной пользователя */
  userVariableName: undefined,
  /** ID целевой группы */
  targetGroupId: undefined,
  /** URL стикера */
  stickerUrl: undefined,
  /** file_id стикера в Telegram */
  stickerFileId: undefined,
  /** URL голосового сообщения */
  voiceUrl: undefined,
  /** URL анимации (GIF) */
  animationUrl: undefined,
  /** Широта для геолокации */
  latitude: undefined,
  /** Долгота для геолокации */
  longitude: undefined,
  /** Заголовок (для локации, контакта и т.д.) */
  title: undefined,
  /** Адрес */
  address: undefined,
  /** ID места в Foursquare */
  foursquareId: undefined,
  /** Тип места в Foursquare */
  foursquareType: undefined,
  /** Сервис карт: "custom", "yandex", "google", "2gis" */
  mapService: 'custom' as const,
  /** URL Яндекс.Карт */
  yandexMapUrl: undefined,
  /** URL Google Maps */
  googleMapUrl: undefined,
  /** URL 2ГИС */
  gisMapUrl: undefined,
  /** Уровень масштабирования карты */
  mapZoom: 15,
  /** Показывать маршрут */
  showDirections: false,
  /** Генерировать превью карты */
  generateMapPreview: true,
  /** Номер телефона */
  phoneNumber: undefined,
  /** Имя */
  firstName: undefined,
  /** Фамилия */
  lastName: undefined,
  /** ID пользователя */
  userId: undefined,
  /** vCard контакта */
  vcard: undefined,
  /** Вопрос для опроса */
  question: undefined,
  /** Разрешить несколько ответов */
  allowsMultipleAnswers: false,
  /** Анонимное голосование */
  anonymousVoting: true,
  /** Эмодзи */
  emoji: undefined,
  /** Длительность медиафайла в секундах */
  mediaDuration: undefined,
  /** Ширина медиафайла */
  width: undefined,
  /** Высота медиафайла */
  height: undefined,
  /** Исполнитель (для аудио) */
  performer: undefined,
  /** Размер файла в байтах */
  fileSize: undefined,
  /** Имя файла */
  filename: undefined,
  /** Тип ввода: "text", "photo", "video", "audio", "document" */
  inputType: 'text' as const,
  /** Тип ответа: "text", "buttons", "multi_select" */
  responseType: 'text' as const,
  /** Варианты ответа */
  responseOptions: [],
  /** Разрешить множественный выбор */
  allowMultipleSelection: false,
  /** Переменная для множественного выбора */
  multiSelectVariable: undefined,
  /** Текст кнопки продолжения */
  continueButtonText: undefined,
  /** Цель кнопки продолжения */
  continueButtonTarget: undefined,
  /** Переменная для сохранения ввода */
  inputVariable: undefined,
  /** Подсказка для ввода */
  inputPrompt: undefined,
  /** Правило валидации ввода */
  inputValidation: undefined,
  /** Обязательный ввод */
  inputRequired: true,
  /** Таймаут ожидания ввода */
  inputTimeout: undefined,
  /** Сообщение при неверном вводе */
  inputRetryMessage: undefined,
  /** Сообщение при успешном вводе */
  inputSuccessMessage: undefined,
  /** Включить условные сообщения */
  enableConditionalMessages: false,
  /** Массив условных сообщений */
  conditionalMessages: [],
  /** Сообщение по умолчанию */
  fallbackMessage: undefined,
  /** Сохранять в базу данных */
  saveToDatabase: false,
  /** Разрешить пропуск */
  allowSkip: false,
  /** Собирать ввод пользователя */
  collectUserInput: false,
  /** ID узла для перехода после ввода */
  inputTargetNodeId: undefined,
  /** Тип кнопок ввода: "inline", "reply" */
  inputButtonType: 'inline' as const,
  /** Включить автоматический переход */
  enableAutoTransition: false,
  /** ID узла для автоперехода */
  autoTransitionTo: undefined,
  /** Минимальная длина ввода */
  minLength: undefined,
  /** Максимальная длина ввода */
  maxLength: undefined,
  /** Плейсхолдер поля ввода */
  placeholder: undefined,
  /** Значение по умолчанию */
  defaultValue: undefined,
  /** Добавлять к существующей переменной */
  appendVariable: false,
  /** Фильтры переменных */
  variableFilters: {},
  /** Включить пользовательские действия */
  enableUserActions: false,
  /** Триггер действия */
  actionTrigger: undefined,
  /** Текст триггера */
  triggerText: undefined,
  /** Тип пользовательского действия */
  userActionType: undefined,
  /** Тег действия */
  actionTag: undefined,
  /** Сообщение действия */
  actionMessage: undefined,
  /** Тихое действие (без уведомления) */
  silentAction: false,
  /** MIME-тип файла */
  mimeType: undefined,
  /** Название набора стикеров */
  stickerSetName: undefined,
  /** Имя файла для отправки */
  fileName: undefined,
  /** Город */
  city: undefined,
  /** Страна */
  country: undefined,
  /** Включить ввод текста */
  enableTextInput: undefined,
  /** Включить ввод фото */
  enablePhotoInput: undefined,
  /** Включить ввод видео */
  enableVideoInput: undefined,
  /** Включить ввод аудио */
  enableAudioInput: undefined,
  /** Включить ввод документа */
  enableDocumentInput: undefined,
  /** Переменная для фото */
  photoInputVariable: undefined,
  /** Переменная для видео */
  videoInputVariable: undefined,
  /** Переменная для аудио */
  audioInputVariable: undefined,
  /** Переменная для документа */
  documentInputVariable: undefined,
  /** Имя */
  name: undefined,
  /** Метка */
  label: undefined,
  /** Символ галочки */
  checkmarkSymbol: undefined,
  /** Символ галочки для множественного выбора */
  multiSelectCheckmark: undefined,
  /** Длительность */
  duration: undefined,
  /** Длительность мута */
  muteDuration: undefined,
  /** Причина */
  reason: undefined,
  /** Может изменять информацию группы */
  canChangeInfo: false,
  /** Может удалять сообщения */
  canDeleteMessages: false,
  /** Может банить пользователей */
  canBanUsers: false,
  /** Может приглашать пользователей */
  canInviteUsers: false,
  /** Может закреплять сообщения */
  canPinMessages: false,
  /** Может добавлять администраторов */
  canAddAdmins: false,
  /** Может ограничивать участников */
  canRestrictMembers: false,
  /** Может повышать участников */
  canPromoteMembers: false,
  /** Может управлять видеочатами */
  canManageVideoChats: false,
  /** Может управлять темами */
  canManageTopics: false,
  /** Анонимный администратор */
  isAnonymous: false,
  /** Может отправлять сообщения */
  canSendMessages: true,
  /** Может отправлять медиасообщения */
  canSendMediaMessages: true,
  /** Может отправлять опросы */
  canSendPolls: true,
  /** Может отправлять другие сообщения */
  canSendOtherMessages: true,
  /** Может добавлять превью веб-страниц */
  canAddWebPagePreviews: true,
  /** Может изменять информацию группы */
  canChangeGroupInfo: true,
  /** Может приглашать пользователей (дубль) */
  canInviteUsers2: true,
  /** Может закреплять сообщения (дубль) */
  canPinMessages2: true,
  /** Дата окончания ограничения */
  untilDate: undefined,
  /** ID целевого пользователя для админ-действий */
  adminTargetUserId: undefined,
  /** Источник ID пользователя для админ-действий */
  adminUserIdSource: 'last_message' as const,
  /** Имя переменной пользователя для админ-действий */
  adminUserVariableName: undefined,
  /** Может управлять чатом */
  can_manage_chat: false,
  /** Может публиковать сообщения */
  can_post_messages: false,
  /** Может редактировать сообщения */
  can_edit_messages: false,
  /** Может удалять сообщения */
  can_delete_messages: false,
  /** Может публиковать истории */
  can_post_stories: false,
  /** Может редактировать истории */
  can_edit_stories: false,
  /** Может удалять истории */
  can_delete_stories: false,
  /** Может управлять видеочатами */
  can_manage_video_chats: false,
  /** Может ограничивать участников */
  can_restrict_members: false,
  /** Может повышать участников */
  can_promote_members: false,
  /** Может изменять информацию */
  can_change_info: false,
  /** Может приглашать пользователей */
  can_invite_users: false,
  /** Может закреплять сообщения */
  can_pin_messages: false,
  /** Может управлять темами */
  can_manage_topics: false,
  /** Анонимный */
  is_anonymous: false,
  /** ID чата для админ-действий */
  adminChatId: undefined,
  /** Источник ID чата: "current_chat", "variable" */
  adminChatIdSource: 'current_chat' as const,
  /** Имя переменной чата */
  adminChatVariableName: undefined,
  /** Прикреплённые медиафайлы */
  attachedMedia: [],
  /** Текст */
  text: undefined,
  /** Действие */
  action: undefined,
  /** Ожидать текстовый ввод */
  waitForTextInput: undefined,
  /** Источник ID: "bot_users", "variable" */
  idSourceType: 'bot_users' as const,
  /** Тип API рассылки: "bot", "userbot" */
  broadcastApiType: 'bot' as const,
  /** Целевой узел рассылки */
  broadcastTargetNode: undefined,
  /** Включить рассылку */
  enableBroadcast: false,
  /** Включить подтверждение */
  enableConfirmation: false,
  /** Текст подтверждения */
  confirmationText: undefined,
  /** Сообщение об успехе */
  successMessage: undefined,
  /** Сообщение об ошибке */
  errorMessage: undefined,
  /** Имя сессии */
  sessionName: 'user_session',
  /** Сессия создана */
  sessionCreated: false,
};
