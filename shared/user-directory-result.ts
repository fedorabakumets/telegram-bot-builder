/** @fileoverview Итог фильтрации по состояниям пользователей и независимой доступности ботов. */
/** Количества статусов в текущей области поиска без ограничения выбранным статусом. */
export type UserStatusCounts = Record<'all' | 'active' | 'inactive' | 'blocked' | 'deleted' | 'botUnavailable' | 'unverified', number> & {
  /** Люди у проблемного бота, имеющие личную переписку с другим доступным ботом проекта. */
  otherAvailableBots?: number;
};
/** Сведения о полном результате независимо от загруженных страниц. */
export interface UserDirectoryResult {
  /** Общее число найденных записей с учётом выбранного статуса. */
  total: number;
  /** Количества для пунктов фильтра статуса. */
  statusCounts?: UserStatusCounts;
  /** Количества людей по источникам без ограничения выбранным источником. */
  sourceCounts?: Record<string, number>;
  /** Количества всех, Premium и обычных аккаунтов без ограничения выбранным Premium. */
  premiumCounts?: Record<'all' | 'true' | 'false', number>;
  /** Количества людей по языкам без ограничения выбранным языком. */
  languageCounts?: Record<string, number>;
}
