/**
 * @fileoverview Топ нажатий кнопок через защищённый API аналитики проекта.
 */
import { USERS_ANALYTICS_WINDOWS, type UsersAnalyticsOptions } from './users-analytics-types.ts';
import { readUsersAnalytics, validUsersAnalyticsOptions, validUsersCount } from './users-analytics-read.ts';
import { messagesAnalyticsError } from './messages-analytics-read.ts';

/** Фильтры топа кнопок. */
export type PopularButtonsOptions = Pick<UsersAnalyticsOptions, 'period' | 'tokenId' | 'apiBaseUrl'>;

/** Элемент рейтинга сохранённых нажатий. */
export interface PopularButtonItem {
  /** Текст кнопки либо данные обратного вызова при отсутствии текста. */
  label: string;
  /** Число сохранённых нажатий за окно. */
  count: number;
}

/**
 * Проверяет ограниченный рейтинг и удаляет посторонние поля ответа.
 * @param raw - Необработанный ответ API.
 * @returns Не более десяти кнопок по убыванию числа нажатий.
 */
export function parsePopularButtons(raw: unknown): PopularButtonItem[] {
  if (!Array.isArray(raw) || raw.length > 10) throw new Error('Некорректный ответ API аналитики');
  const labels = new Set<string>();
  const items: PopularButtonItem[] = raw.map(item => {
    if (!item || typeof item.label !== 'string' || item.label.length > 1000 ||
      labels.has(item.label) || !validUsersCount(item.count)) throw new Error('Некорректный ответ API аналитики');
    labels.add(item.label);
    return { label: item.label, count: item.count };
  });
  if (!validUsersCount(items.reduce((sum, item) => sum + item.count, 0))) {
    throw new Error('Некорректный ответ API аналитики');
  }
  return items.sort((a, b) => b.count - a.count);
}

/**
 * Возвращает рейтинг кнопок с фильтром бота и точным описанием метрики.
 * @param projectId - Идентификатор доступного проекта.
 * @param options - Период, бот и адрес API приложения.
 * @returns Топ кнопок либо безопасная ошибка чтения.
 */
export async function getPopularButtonsInDb(projectId: number, options: PopularButtonsOptions = {}) {
  if (!validUsersAnalyticsOptions(projectId, options)) return { error: 'Некорректные параметры аналитики' };
  try {
    const period = options.period ?? '30d';
    const query = new URLSearchParams({ granularity: USERS_ANALYTICS_WINDOWS[period].granularity });
    if (options.tokenId !== undefined) query.set('tokenId', String(options.tokenId));
    const items = parsePopularButtons(await readUsersAnalytics(`/api/projects/${projectId}/users/popular-buttons?${query}`, options));
    const windowSeconds = { '1h': 3600, '3h': 10800, '24h': 86400, '7d': 604800,
      '30d': 2592000, '12w': 7257600, '12m': 31536000 }[period];
    return {
      project_id: projectId, token_id: options.tokenId ?? null, period,
      window_seconds: windowSeconds, timestamp_timezone: 'UTC', limit: 10, items,
      returned_clicks: items.reduce((sum, item) => sum + item.count, 0),
      metric_description: 'Нажатие — сохранённое входящее сообщение с message_data.button_clicked=true. Повторные нажатия учитываются отдельно. Кнопки с одинаковой меткой объединяются, включая разные боты при отсутствии token_id.',
      label_description: 'Метка — непустой button_text, иначе callback_data. Записи без обеих меток исключаются.',
      total_description: 'returned_clicks — сумма нажатий только возвращённых десяти кнопок, а не всех кнопок проекта. Счётчик за всё время API не предоставляет.',
      range_description: 'Скользящее окно определяется серверным NOW(); API не возвращает точные границы или время среза. 12w — 84 дня, 12m — 365 дней.',
      retention_description: 'Рейтинг зависит от сохранённой истории bot_messages; удаление сообщений уменьшает счётчики. Это не пожизненная статистика.',
    };
  } catch (error) { return messagesAnalyticsError(error); }
}
