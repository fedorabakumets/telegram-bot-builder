/**
 * @fileoverview Снимок распределения Premium для карточки аналитики через защищённый API.
 */
import { readUsersAnalytics, validUsersCount } from './users-analytics-read.ts';
import { messagesAnalyticsError } from './messages-analytics-read.ts';

/** Фильтры текущего снимка Premium. */
export interface UsersPremiumOptions {
  /** Идентификатор бота; отсутствие означает всех ботов проекта. */
  tokenId?: number;
  /** Базовый адрес API приложения. */
  apiBaseUrl?: string;
}

/**
 * Проверяет идентификаторы до запроса API.
 * @param projectId - Идентификатор проекта.
 * @param options - Фильтр бота.
 * @returns Допустимы ли идентификаторы.
 */
function validPremiumOptions(projectId: number, options: UsersPremiumOptions): boolean {
  return Number.isSafeInteger(projectId) && projectId > 0 &&
    (options.tokenId === undefined || (Number.isSafeInteger(options.tokenId) && options.tokenId > 0));
}

/**
 * Возвращает проверенный снимок Premium с процентами, округлёнными как в UI.
 * @param projectId - Идентификатор доступного проекта.
 * @param options - Бот и адрес API.
 * @returns Счётчики и элементы кольцевого графика либо безопасная ошибка.
 */
export async function getUsersPremiumInDb(projectId: number, options: UsersPremiumOptions = {}) {
  if (!validPremiumOptions(projectId, options)) return { error: 'Некорректные параметры аналитики' };
  try {
    const query = options.tokenId === undefined ? '' : `?tokenId=${options.tokenId}`;
    const raw = await readUsersAnalytics(`/api/projects/${projectId}/users/stats${query}`, options);
    if (!raw || typeof raw !== 'object' || !('totalUsers' in raw) || !('premiumUsers' in raw) ||
      !validUsersCount(raw.totalUsers) || !validUsersCount(raw.premiumUsers) || raw.premiumUsers > raw.totalUsers) {
      throw new Error('Некорректный ответ API аналитики');
    }
    const total = raw.totalUsers;
    const premium = raw.premiumUsers;
    const regular = total - premium;
    return {
      project_id: projectId, token_id: options.tokenId ?? null,
      total_users: total, premium_users: premium, regular_users: regular,
      items: [
        { label: 'Premium', count: premium, percentage: total === 0 ? 0 : Math.round(premium / total * 100) },
        { label: 'Обычные', count: regular, percentage: total === 0 ? 0 : Math.round(regular / total * 100) },
      ],
      scope: 'current_snapshot',
      metric_description: 'Текущие сохранённые записи bot_users. Premium означает is_premium = 1; остальные записи входят в группу «Обычные». Один человек у нескольких ботов может учитываться несколько раз. Это снимок профилей, а не история подписки или регистрации за период.',
      percentage_description: 'Знаменатель — total_users. Проценты округляются независимо до целых, как в UI; сумма может отличаться от 100. Для пустой аудитории оба процента равны нулю.',
      freshness_description: 'Статус Premium соответствует последним сохранённым данным профиля и может отличаться от текущего статуса в Telegram.',
    };
  } catch (error) { return messagesAnalyticsError(error); }
}
