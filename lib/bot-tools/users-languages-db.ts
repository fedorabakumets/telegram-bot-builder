/** @fileoverview Снимок языков аудитории через защищённый API проекта. */
import { readUsersAnalytics } from './users-analytics-read.ts';
import { messagesAnalyticsError } from './messages-analytics-read.ts';
import { parseUsersLanguages, type UsersLanguagesOptions } from './users-languages-read.ts';

/**
 * Возвращает до двадцати крупнейших языков текущей сохранённой аудитории.
 * @param projectId - Идентификатор проекта.
 * @param options - Бот и адрес API.
 * @returns Распределение языков либо безопасная ошибка.
 */
export async function getUsersLanguagesInDb(projectId: number, options: UsersLanguagesOptions = {}) {
  if (!Number.isSafeInteger(projectId) || projectId <= 0 || (options.tokenId !== undefined &&
    (!Number.isSafeInteger(options.tokenId) || options.tokenId <= 0))) return { error: 'Некорректные параметры аналитики' };
  try {
    const query = new URLSearchParams();
    if (options.tokenId !== undefined) query.set('tokenId', String(options.tokenId));
    const raw = await readUsersAnalytics(`/api/projects/${projectId}/users/traffic?${query}`, options);
    const languages = parseUsersLanguages(raw);
    const returnedUsers = languages.reduce((total, row) => total + row.count, 0);
    if (!Number.isSafeInteger(returnedUsers)) throw new Error('Некорректный ответ API аналитики');
    return {
      project_id: projectId, token_id: options.tokenId ?? null,
      languages, returned_users: returnedUsers, returned_language_count: languages.length, limit: 20,
      possibly_truncated: languages.length === 20,
      metric_description: 'Снимок записей bot_users с language_code IS NOT NULL. Один человек у нескольких ботов может учитываться несколько раз. Период не применяется.',
      percentage_description: 'Проценты API среди всех записей с известным языком, округлены до десятых. Возвращаются только двадцать крупнейших языков; сумма процентов может быть меньше 100%. returned_users — сумма только возвращённых строк.',
      coverage_description: 'Число записей без языка и общий размер аудитории с известным языком этот API не возвращает. При двадцати строках возможна обрезка списка; точный факт обрезки неизвестен.',
    };
  } catch (error) { return messagesAnalyticsError(error); }
}
