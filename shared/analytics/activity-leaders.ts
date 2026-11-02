/** @fileoverview Контракт рейтингов сохранённых входящих сообщений и нажатий. */
export interface ActivityLeader {
  /** Telegram ID человека или группы. */
  id: string;
  /** Отображаемое имя. */
  name: string;
  /** Имя пользователя, если сохранено. */
  username?: string | null;
  /** Общее число действий. */
  total: number;
  /** Входящие сообщения без callback. */
  messages: number;
  /** Callback-нажатия. */
  clicks: number;
  /** Последнее действие периода. */
  last_activity: string;
}
export interface ActivityLeaders {
  /** Первые десять пользователей. */
  users: ActivityLeader[];
  /** Первые десять групп. */
  groups: ActivityLeader[];
  /** Общая граница снимка данных. */
  as_of: string;
}
