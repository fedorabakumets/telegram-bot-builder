/** @fileoverview Ограниченный поиск сохранённых логов через авторизованный API. */
import { apiFetch } from './api-fetch.ts';

/** Параметры поиска сохранённых строк. */
export interface BotLogSearchOptions {
  /** Начало периода включительно, ISO с часовым поясом. */
  from: string;
  /** Конец периода исключительно, ISO с часовым поясом. */
  to: string;
  /** Подстрока без учёта регистра. */
  text?: string;
  /** Канал вывода. */
  type?: 'stdout' | 'stderr' | 'status';
  /** Максимальное количество совпадений. */
  limit?: number;
  /** Исключительная граница идентификаторов. */
  beforeId?: number;
  /** Адрес сервера приложения. */
  apiBaseUrl?: string;
}
/** Строка без служебных полей и токена. */
export interface SearchBotLog {
  /** Идентификатор строки. */
  id: number;
  /** Текст лога. */
  content: string;
  /** Канал вывода. */
  type: string;
  /** Время записи. */
  timestamp: string | null;
}
/** Проверяет параметры до обращения к серверу.
 * @param projectId - Проект
 * @param tokenId - Бот
 * @param options - Параметры
 * @returns Текст ошибки либо отсутствие ошибки
 */
export function validateLogSearch(projectId: number, tokenId: number, options: BotLogSearchOptions): string | undefined {
  if (![projectId, tokenId, options.limit ?? 100, options.beforeId ?? 1].every(n => Number.isSafeInteger(n) && n > 0)) return 'Идентификаторы, курсор и лимит должны быть положительными целыми';
  if ((options.limit ?? 100) > 1000) return 'Максимальный лимит — 1000';
  const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/;
  if (![options.from, options.to].every(value => iso.test(value) && Number.isFinite(Date.parse(value))) || Date.parse(options.from) >= Date.parse(options.to)) return 'Нужен корректный период ISO с часовым поясом: from < to';
  if (options.type !== undefined && !['stdout', 'stderr', 'status'].includes(options.type)) return 'Неизвестный тип лога';
  if (options.text !== undefined && (typeof options.text !== 'string' || options.text.length > 1000)) return 'Поисковая строка должна содержать до 1000 символов';
  return undefined;
}
/** Ищет совпадения, сканируя не более 1000 строк; продолжение задаёт курсор.
 * @param projectId - Проект
 * @param tokenId - Бот
 * @param options - Период и фильтры
 * @returns Страница результатов либо безопасная ошибка
 */
export async function searchBotLogsInDb(projectId: number, tokenId: number, options: BotLogSearchOptions) {
  const error = validateLogSearch(projectId, tokenId, options);
  if (error) return { error };
  const params = new URLSearchParams({ from: options.from, to: options.to, limit: '1000' });
  if (options.beforeId !== undefined) params.set('beforeId', String(options.beforeId));
  try {
    const response = await apiFetch(`/api/projects/${projectId}/tokens/${tokenId}/logs?${params}`, { apiBaseUrl: options.apiBaseUrl });
    if (!response.ok) return { error: `Не удалось получить логи: HTTP ${response.status}` };
    const body: unknown = await response.json();
    if (!Array.isArray(body) || body.length > 1000 || body.some(row => !row || !Number.isSafeInteger(row.id) || row.id < 1 || typeof row.content !== 'string' || typeof row.type !== 'string')) return { error: 'Некорректный ответ API логов' };
    const rows = body.sort((a, b) => b.id - a.id);
    const logs: SearchBotLog[] = [];
    let scanned = 0;
    for (const row of rows) {
      scanned++;
      if ((!options.type || options.type === row.type) && (!options.text || row.content.toLowerCase().includes(options.text.toLowerCase()))) {
        logs.push({ id: row.id, content: row.content, type: row.type, timestamp: typeof row.timestamp === 'string' ? row.timestamp : null });
      }
      if (logs.length >= (options.limit ?? 100)) break;
    }
    const hasMore = scanned < rows.length || rows.length === 1000;
    return { logs, count: logs.length, scanned, nextBeforeId: hasMore ? rows[scanned - 1]?.id ?? null : null, hasMore, order: 'id_desc' as const, retentionLimited: true as const };
  } catch { return { error: 'Не удалось получить логи: ошибка соединения или ответа API' }; }
}
