/** @fileoverview Ответ API со сведениями пользователя бота или группового диалога. */

/** Запись из списка пользователей и диалогов. */
export interface UserBotData {
  /** Основание контакта: личное обращение, групповая история, импорт или отсутствие доказательств. */
  contactOrigin?: 'private' | 'group_history' | 'imported' | 'unknown';
  /** Дата первого сохранённого входящего сообщения или нажатия в текущей области ботов. */
  firstSavedMessageAt?: string | null;
  /** Номер строки в текущей выдаче. */
  id: string;
  /** Идентификатор пользователя или чата в Telegram. */
  userId: string;
  /** Время импорта контакта; не подтверждает наличие переписки с ботом. */
  importedAt?: string | null;
  /** Есть ли сохранённая личная переписка в текущей области ботов. */
  hasPrivateMessages?: boolean;
  /** Бот исходной записи для загрузки привязанного к нему аватара. */
  tokenId?: number;
  /** Боты пользователя и переменные с сохранением принадлежности каждому боту. */
  botMemberships?: import('../user-bot-membership').UserBotMembership[];
  /** Имя пользователя в Telegram. */
  userName: string | null;
  /** Имя пользователя или название группы. */
  firstName: string | null;
  /** Фамилия пользователя. */
  lastName: string | null;
  /** Адрес аватара. */
  avatarUrl: string | null;
  /** Время регистрации в формате ISO. */
  registeredAt: string | null;
  /** Время создания записи в формате ISO. */
  createdAt: string | null;
  /** Время последнего взаимодействия в формате ISO. */
  lastInteraction: string | null;
  /** Количество взаимодействий. */
  interactionCount: number;
  /** Количество сохранённых личных входящих сообщений без нажатий кнопок. */
  incomingMessageCount?: number;
  /** Количество сохранённых нажатий кнопок в личном диалоге. */
  buttonClickCount?: number;
  /** Название первого источника по атрибуции аналитики. */
  acquisitionSource?: string;
  /** Признак активного пользователя. */
  isActive: boolean;
  /** Признак подписки Premium. */
  isPremium: boolean;
  /** Признак блокировки бота пользователем; null при запасной выборке. */
  isBlocked: boolean | null;
  /** Признак удалённого аккаунта; null при запасной выборке. */
  isDeleted: boolean | null;
  /** Признак бота. */
  isBot: boolean;
  /** Код языка. */
  languageCode: string | null;
  /** Параметр первой ссылки запуска. */
  deepLinkParam: string | null;
  /** Идентификатор пригласившего пользователя. */
  referrerId: string | null;
  /** Данные пользователя из базы. */
  userData: unknown;
  /** Текст последнего сообщения. */
  lastMessageText: string | null;
  /** Время последнего сообщения в формате ISO. */
  lastMessageAt: string | null;
  /** Признак группового диалога. */
  isGroup: boolean;
  /** Тип группового чата. */
  chatType: string | null;
}
