/**
 * @fileoverview Данные по умолчанию для узлов бота
 * Для инициализации новых узлов в Telegram Bot Builder.
 * @module node-defaults
 */

import { Node } from '@shared/schema';
import { normalizeDynamicButtonsConfig } from './dynamic-buttons';

/**
 * Получает данные по умолчанию для типа узла.
 * @param {Node['type']} type - Тип узла
 * @returns {any} Объект с данными по умолчанию
 */
export function getNodeDefaults(type: Node['type']): any {
  const defaults: Partial<Record<Node['type'], any>> = {
    message: {
      messageText: 'Новое сообщение',
      keyboardType: 'none',
      buttons: [],
      markdown: false,
      oneTimeKeyboard: false,
      resizeKeyboard: true,
      saveMessageIdTo: ''
    },
    sticker: {
      stickerUrl: '',
      stickerFileId: '',
      messageText: 'Стикер',
      keyboardType: 'none',
      buttons: [],
      markdown: false,
      oneTimeKeyboard: false,
      resizeKeyboard: true
    },
    voice: {
      voiceUrl: '',
      duration: 0,
      messageText: 'Голосовое сообщение',
      keyboardType: 'none',
      buttons: [],
      markdown: false,
      oneTimeKeyboard: false,
      resizeKeyboard: true
    },
    animation: {
      animationUrl: '',
      duration: 0,
      width: 0,
      height: 0,
      mediaCaption: '',
      messageText: 'Анимация',
      keyboardType: 'none',
      buttons: [],
      markdown: false,
      oneTimeKeyboard: false,
      resizeKeyboard: true
    },
    location: {
      latitude: 55.7558,
      longitude: 37.6176,
      title: 'Москва',
      address: 'Москва, Россия',
      foursquareId: '',
      foursquareType: '',
      messageText: 'Местоположение',
      keyboardType: 'none',
      buttons: [],
      markdown: false,
      oneTimeKeyboard: false,
      resizeKeyboard: true
    },
    contact: {
      phoneNumber: '+7 (999) 123-45-67',
      firstName: 'Имя',
      lastName: 'Фамилия',
      userId: 0,
      vcard: '',
      messageText: 'Контакт',
      keyboardType: 'none',
      buttons: [],
      markdown: false,
      oneTimeKeyboard: false,
      resizeKeyboard: true
    },
    start: {
      command: '/start',
      description: 'Запустить бота',
      messageText: 'Привет! Добро пожаловать!',
      keyboardType: 'none',
      buttons: [],
      markdown: false,
      oneTimeKeyboard: false,
      resizeKeyboard: true,
      showInMenu: true,
      isPrivateOnly: false,
      requiresAuth: false,
      adminOnly: false,
      synonyms: []
    },
    command: {
      command: '/custom',
      description: 'Новая команда',
      messageText: 'Команда выполнена',
      keyboardType: 'none',
      buttons: [],
      markdown: false,
      oneTimeKeyboard: false,
      resizeKeyboard: true,
      showInMenu: true,
      isPrivateOnly: false,
      requiresAuth: false,
      adminOnly: false,
      synonyms: []
    },
    command_trigger: {
      command: '/start',
      description: '',
      autoTransitionTo: '',
      showInMenu: false,
      isPrivateOnly: false,
      requiresAuth: false,
      adminOnly: false
    },
    text_trigger: {
      textSynonyms: [],
      textMatchType: 'exact',
      autoTransitionTo: '',
      isPrivateOnly: false,
      requiresAuth: false,
      adminOnly: false
    },
    pin_message: {
      command: '/pin_message',
      synonyms: ['закрепить', 'прикрепить', 'зафиксировать'],
      disableNotification: false,
      targetMessageId: '',
      messageIdSource: 'last_message',
      variableName: ''
    },
    unpin_message: {
      command: '/unpin_message',
      synonyms: ['открепить', 'отцепить', 'убрать закрепление'],
      targetMessageId: '',
      messageIdSource: 'last_message',
      variableName: ''
    },
    delete_message: {
      messageIdSource: 'current_message',
      messageIdManual: '',
      lastNCount: '',
      chatIdSource: 'current_chat',
      chatIdManual: '',
      ignoreErrors: true,
      bulkDelete: false,
      bulkMessageIdsVariable: '',
    },
    forward_message: {
      command: '',
      synonyms: [],
      sourceMessageId: '',
      sourceMessageIdSource: 'current_message',
      sourceMessageNodeId: '',
      sourceMessageVariableName: '',
      targetChatId: '',
      targetChatIdSource: 'manual',
      targetChatVariableName: '',
      targetChatTargets: [],
      disableNotification: false
    },
    ban_user: {
      command: '/ban_user',
      synonyms: ['забанить', 'заблокировать', 'бан'],
      reason: 'Нарушение правил группы',
      untilDate: 0,
      targetUserId: '',
      userIdSource: 'last_message',
      userVariableName: ''
    },
    unban_user: {
      command: '/unban_user',
      synonyms: ['разбанить', 'разблокировать', 'unbан'],
      targetUserId: '',
      userIdSource: 'last_message',
      userVariableName: ''
    },
    mute_user: {
      command: '/mute_user',
      synonyms: ['замутить', 'заглушить', 'мут'],
      reason: 'Нарушение правил группы',
      duration: 3600,
      canSendMessages: false,
      canSendMediaMessages: false,
      canSendPolls: false,
      canSendOtherMessages: false,
      canAddWebPagePreviews: false,
      canChangeGroupInfo: false,
      canInviteUsers2: false,
      canPinMessages2: false,
      targetUserId: '',
      userIdSource: 'last_message',
      userVariableName: ''
    },
    unmute_user: {
      command: '/unmute_user',
      synonyms: ['размутить', 'разглушить', 'анмут'],
      targetUserId: '',
      userIdSource: 'last_message',
      userVariableName: ''
    },
    kick_user: {
      userIdSource: 'current_user',
      userIdManual: '',
      userVariableName: '',
      chatIdSource: 'current_chat',
      chatIdManual: '',
      ignoreErrors: true,
    },
    promote_user: {
      command: '/promote_user',
      synonyms: ['повысить', 'назначить админом', 'промоут'],
      canChangeInfo: false,
      canDeleteMessages: true,
      canBanUsers: false,
      canInviteUsers: true,
      canPinMessages: true,
      canAddAdmins: false,
      canRestrictMembers: false,
      canPromoteMembers: false,
      canManageVideoChats: false,
      canManageTopics: false,
      isAnonymous: false,
      targetUserId: '',
      userIdSource: 'last_message',
      userVariableName: ''
    },
    demote_user: {
      command: '/demote_user',
      synonyms: ['понизить', 'снять с админки', 'демоут'],
      targetUserId: '',
      userIdSource: 'last_message',
      userVariableName: ''
    },
    admin_rights: {
      command: '/admin_rights',
      description: 'Управление правами администратора',
      synonyms: ['права админа', 'изменить права', 'админ права', 'тг права', 'права'],
      adminUserIdSource: 'last_message',
      adminChatIdSource: 'current_chat',
      keyboardType: 'inline',
      buttons: [
        { id: 'perm_change_info', text: '🏷️ Изменение профиля', action: 'command', target: 'toggle_change_info', skipDataCollection: false, hideAfterClick: false },
        { id: 'perm_delete_messages', text: '🗑️ Удаление сообщений', action: 'command', target: 'toggle_delete_messages', skipDataCollection: false, hideAfterClick: false },
        { id: 'perm_restrict_members', text: '🚫 Блокировка участников', action: 'command', target: 'toggle_restrict_members', skipDataCollection: false, hideAfterClick: false },
        { id: 'perm_invite_users', text: '📨 Приглашение участников', action: 'command', target: 'toggle_invite_users', skipDataCollection: false, hideAfterClick: false },
        { id: 'perm_pin_messages', text: '📌 Закрепление сообщений', action: 'command', target: 'toggle_pin_messages', skipDataCollection: false, hideAfterClick: false },
        { id: 'perm_manage_video_chats', text: '🎥 Управление видеочатами', action: 'command', target: 'toggle_manage_video_chats', skipDataCollection: false, hideAfterClick: false },
        { id: 'perm_anonymous', text: '🔒 Анонимность', action: 'command', target: 'toggle_anonymous', skipDataCollection: false, hideAfterClick: false },
        { id: 'perm_promote_members', text: '👑 Назначение администраторов', action: 'command', target: 'toggle_promote_members', skipDataCollection: false, hideAfterClick: false }
      ],
      can_manage_chat: false,
      can_post_messages: false,
      can_edit_messages: false,
      can_delete_messages: true,
      can_post_stories: false,
      can_edit_stories: false,
      can_delete_stories: false,
      can_manage_video_chats: false,
      can_restrict_members: false,
      can_promote_members: false,
      can_change_info: false,
      can_invite_users: true,
      can_pin_messages: true,
      can_manage_topics: false,
      is_anonymous: false
    },
    broadcast: {
      idSourceType: 'bot_users',
      enableConfirmation: true,
      confirmationText: 'Отправить рассылку всем пользователям?',
      successMessage: '✅ Рассылка отправлена!',
      errorMessage: '❌ Ошибка рассылки'
    },
    photo: {
      messageText: '',
      keyboardType: 'none',
      buttons: []
    },
    video: {
      messageText: '',
      keyboardType: 'none',
      buttons: []
    },
    audio: {
      messageText: '',
      keyboardType: 'none',
      buttons: []
    },
    document: {
      messageText: '',
      keyboardType: 'none',
      buttons: []
    },
    keyboard: {
      keyboardType: 'inline',
      buttons: [],
      enableDynamicButtons: false,
      dynamicButtons: normalizeDynamicButtonsConfig({
        sourceVariable: '',
        arrayPath: '',
        textTemplate: '{name}',
        callbackTemplate: 'project_{id}',
        styleMode: 'none',
        styleField: '',
        styleTemplate: '',
        columns: 2,
      }),
    },
    input: {
      inputType: 'any',
      inputVariable: '',
      inputTargetNodeId: '',
      appendVariable: false,
      saveToDatabase: false,
      inputPrompt: 'Введите ответ',
      inputRequired: true
    },
    condition: {
      enableConditionalMessages: true,
      conditionalMessages: []
    },
    client_auth: {
      sessionName: 'user_session',
      sessionCreated: false
    },
    media: {
      mediaMode: 'single',
      mediaItems: [],
      attachedMedia: [],
      enableAutoTransition: false,
      autoTransitionTo: '',
      saveMessageIdTo: ''
    },
    managed_bot_updated_trigger: {
      saveBotIdTo: 'bot_id',
      saveBotUsernameTo: 'bot_username',
      saveBotNameTo: 'bot_name',
      saveCreatorIdTo: 'creator_id',
      saveCreatorUsernameTo: 'creator_username',
      filterByUserId: '',
      autoTransitionTo: '',
    },
    schedule_trigger: {
      rules: [{ mode: 'interval', intervalMinutes: 5 }],
      timezone: 'Europe/Moscow',
      autoTransitionTo: '',
      runOnStart: false,
      enabled: true,
      maxConcurrent: 1,
    },
    get_managed_bot_token: {
      botIdSource: 'variable',
      botIdVariable: 'bot_id',
      botIdManual: '',
      saveTokenTo: 'bot_token',
      saveErrorTo: '',
      autoTransitionTo: '',
    },
    answer_callback_query: {
      /** Текст уведомления (0–200 символов) */
      callbackNotificationText: '',
      /** Показать как алерт (true) или тост (false) */
      callbackShowAlert: false,
      /** Время кеширования ответа в секундах */
      callbackCacheTime: 0,
    },
    edit_message: {
      /** Режим редактирования: 'text' | 'markup' | 'both' */
      editMode: 'text',
      /** Новый текст сообщения */
      editMessageText: '',
      /** Режим форматирования: 'html' | 'markdown' | 'none' */
      editFormatMode: 'none',
      /** Источник ID сообщения */
      editMessageIdSource: 'current_message',
      /** Имя переменной с ID сообщения */
      editMessageIdVariable: '',
      /** ID сообщения вручную */
      editMessageIdManual: '',
      /** Источник ID чата */
      editChatIdSource: 'current_chat',
      /** Имя переменной с ID чата */
      editChatIdVariable: '',
      /** ID чата вручную */
      editChatIdManual: '',
      /** Убрать клавиатуру */
      editRemoveKeyboard: false,
      /** Новые кнопки */
      editButtons: [],
      /** Тип клавиатуры */
      editKeyboardType: 'inline',
    },
    psql_query: {
      /** SQL-запрос к базе данных */
      query: '',
      /** Переменная для сохранения результата */
      saveResultTo: '',
      /** Формат результата */
      resultFormat: 'first_row',
      /** Шаблон строки для формата text */
      textTemplate: '',
      /** ID следующего узла */
      autoTransitionTo: '',
      /** Включить автопереход */
      enableAutoTransition: false,
      /** Источник подключения к БД */
      connectionSource: 'builtin',
      /** Переменная окружения бота для подключения */
      connectionEnvVar: '',
      /** Connection string для ручного ввода */
      connectionString: '',
    },
    loop: {
      /** Имя переменной с массивом */
      sourceVariable: '',
      /** Имя переменной для текущего элемента */
      itemVariable: 'item',
      /** Имя переменной для индекса итерации */
      indexVariable: 'index',
      /** Параллельное выполнение */
      parallel: false,
      /** Пауза между итерациями в секундах */
      delaySeconds: 0,
      /** Максимум итераций (0 = без лимита) */
      maxIterations: 0,
      /** ID первой ноды тела цикла */
      autoTransitionTo: '',
      /** ID ноды после завершения цикла */
      afterLoopTo: '',
      /** Включить автопереход в тело */
      enableAutoTransition: true,
      /** Кнопки (для совместимости) */
      buttons: [],
      /** Тип клавиатуры (для совместимости) */
      keyboardType: 'none',
      /** Текст сообщения (для совместимости) */
      messageText: '',
    },
    bot_table: {
      /** Имя таблицы */
      tableName: '',
      /** Операция: read, insert, update, upsert, delete, count, sum, max, min, avg, distinct, delete_all */
      operation: 'read',
      /** Условия WHERE */
      where: [],
      /** Обновления полей */
      updates: [],
      /** Данные строки */
      row: {},
      /** Ключ для upsert */
      key: '',
      /** Поведение при конфликте */
      onConflict: 'ignore',
      /** Переменная для результата */
      saveResultTo: '',
      /** Формат результата */
      resultFormat: 'first_row',
      /** Колонки для возврата */
      returnColumns: [],
      /** Сортировка */
      orderBy: '',
      /** Направление сортировки */
      orderDirection: 'desc',
      /** Лимит строк */
      limit: 0,
      /** Колонка для агрегации (sum, max, min, avg, distinct) */
      aggregateColumn: '',
      /** Смещение строк (для пагинации) */
      offset: 0,
      /** ID следующего узла */
      autoTransitionTo: '',
      /** Включить автопереход */
      enableAutoTransition: false,
      /** Вернуть ID вставленной строки (для insert/upsert) */
      returnInsertedId: false,
    },
    delay: {
      /** Задержка в секундах (поддерживает {переменные}) */
      seconds: '3',
      /** Единица измерения времени */
      unit: 'seconds',
      /** Режим: blocking — пауза, background — фоновый таймер */
      mode: 'blocking',
      /** ID следующего узла */
      autoTransitionTo: '',
      /** Включить автопереход */
      enableAutoTransition: false,
    },
    userbot_edit_trigger: {
      /** Сущность (чат/канал) для отслеживания */
      userbotEntity: '',
      /** Тип фильтра: any, contains, regex */
      filterType: 'any',
      /** Значение фильтра */
      filterValue: '',
      /** Переменная для текста отредактированного сообщения */
      saveTextTo: 'edit_text',
      /** Переменная для ID сообщения */
      saveMessageIdTo: 'edit_msg_id',
      /** Переменная для ID чата (опционально) */
      saveChatIdTo: '',
      /** Переменная для ID отправителя (опционально) */
      saveSenderIdTo: '',
      /** ID следующего узла */
      autoTransitionTo: '',
    },
  };
  return defaults[type] || {};
}
