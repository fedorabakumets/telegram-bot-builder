/** @fileoverview Связь пользователя с конкретным ботом и его сохранёнными переменными. */
export interface UserBotMembership {
  /** Основание контакта: личное обращение, групповая история, импорт или отсутствие доказательств. */
  contactOrigin?: 'private' | 'group_history' | 'imported' | 'unknown';
  /** Дата первого сохранённого входящего сообщения или нажатия в текущей области ботов. */
  firstSavedMessageAt?: string | null;
  /** Идентификатор бота внутри проекта. */
  tokenId: number;
  /** Время импорта контакта в этого бота. */
  importedAt?: string | null;
  /** Есть ли сохранённая личная переписка именно с этим ботом. */
  hasPrivateMessages?: boolean;
  /** Читаемое название бота. */
  name: string;
  /** Публичное имя бота в Telegram. */
  username: string | null;
  /** Статус пользователя именно в этом боте. */
  status: string;
  /** Переменные, сохранённые этим ботом. */
  userData: unknown;
  /** Входящие сообщения именно этому боту. */
  incomingMessageCount: number;
  /** Нажатия кнопок именно этого бота. */
  buttonClickCount: number;
  /** Последняя активность в этом боте. */
  lastInteraction: string | null;
  /** Источник первого обращения к этому боту. */
  acquisitionSource: string;
  /** Флаг активности в этом боте. */
  isActive: boolean;
  /** Пользователь заблокировал этого бота. */
  isBlocked: boolean;
  /** Аккаунт отмечен удалённым в этом боте. */
  isDeleted: boolean;
  /** Отдельная проблема самого бота; отсутствие ошибки не подтверждает его запуск. */
  botAvailability?: string | null;
}
