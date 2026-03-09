/**
 * @fileoverview Права блокировки участника
 * @module server/telegram/types/client/banned-rights
 */

/**
 * Права доступа участника чата (ограничения)
 */
export interface BannedRights {
  /** Просмотр сообщений (заблокировано) */
  viewMessages?: boolean;

  /** Отправка сообщений */
  sendMessages?: boolean;

  /** Отправка медиа */
  sendMedia?: boolean;

  /** Отправка стикеров */
  sendStickers?: boolean;

  /** Отправка GIF */
  sendGifs?: boolean;

  /** Отправка игр */
  sendGames?: boolean;

  /** Отправка inline-запросов */
  sendInline?: boolean;

  /** Вставка ссылок */
  embedLinks?: boolean;

  /** Отправка опросов */
  sendPolls?: boolean;

  /** Изменение информации */
  changeInfo?: boolean;

  /** Приглашение пользователей */
  inviteUsers?: boolean;

  /** Закрепление сообщений */
  pinMessages?: boolean;

  /** Управление темами */
  manageTopics?: boolean;
}
