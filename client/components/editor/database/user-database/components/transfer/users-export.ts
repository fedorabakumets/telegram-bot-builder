/** @fileoverview Полная постраничная выгрузка выбранной аудитории без повторов людей. */
import type { UserBotData } from '@shared/schema';
import { buildUsersApiUrl } from '@/components/editor/database/utils';

/** Параметры выгрузки совпадают с областью и фильтрами таблицы пользователей. */
export interface ExportUsersOptions {
  /** Разрешённый текущему пользователю проект. */
  projectId: number;
  /** Выбранный бот; отсутствие означает всех ботов проекта. */
  tokenId?: number | null;
  /** Поиск, источник, статусы, дополнительные фильтры и сортировка таблицы. */
  query: Record<string, string>;
  /** Отмена при закрытии окна, смене области или повторной выгрузке. */
  signal: AbortSignal;
  /** Обновление числа загруженных уникальных людей и общего итога. */
  onProgress?: (loaded: number, total: number) => void;
}
/** Максимум проверяемых исходных строк; превышение не даёт неполный файл. */
const MAX_ROWS = 50_000;
/** Умеренный размер страницы ограничивает стоимость пакетного обогащения метрик. */
const PAGE_SIZE = 200;
/** Допустимые параметры не позволяют случайно включить выдачу диалогов или переменных. */
const FILTER_KEYS = ['search', 'source', 'status', 'premium', 'filters', 'sortBy', 'sortDir', 'filterActive'];

/**
 * Загружает все страницы с текущими фильтрами, а не только видимые строки таблицы.
 * @param options - Область, параметры поиска и сигнал отмены.
 * @returns Уникальные пользователи в серверном порядке сортировки.
 */
export async function exportUsers({ projectId, tokenId, query, signal, onProgress }: ExportUsersOptions): Promise<UserBotData[]> {
  if (!Number.isSafeInteger(projectId) || projectId < 1 ||
      (tokenId != null && (!Number.isSafeInteger(tokenId) || tokenId < 1))) {
    throw new Error('Выберите проект и бота для экспорта');
  }
  const filters = Object.fromEntries(FILTER_KEYS.filter(key => query[key] !== undefined).map(key => [key, query[key]]));
  const users = new Map<string, UserBotData>();
  let offset = 0;
  while (true) {
    signal.throwIfAborted();
    const url = buildUsersApiUrl(`/api/projects/${projectId}/users`, tokenId, {
      ...filters, privateContactsOnly: 'true', limit: String(PAGE_SIZE), offset: String(offset),
    });
    const response = await fetch(url, { credentials: 'include', signal });
    if (!response.ok) throw new Error(`Не удалось загрузить пользователей для экспорта (код ${response.status})`);
    const page = await response.json();
    signal.throwIfAborted();
    if (!Array.isArray(page.users) || !Number.isSafeInteger(page.total) || page.total < 0 || typeof page.hasMore !== 'boolean') {
      throw new Error('Сервер вернул некорректную страницу пользователей');
    }
    if (page.total > MAX_ROWS || offset + page.users.length > MAX_ROWS) {
      throw new Error('Для экспорта доступно до 50 000 записей. Уточните фильтры и повторите выгрузку');
    }
    for (const user of page.users as UserBotData[]) {
      if (!user || typeof user.userId !== 'string' || !user.userId) {
        throw new Error('В выгрузке обнаружен пользователь без Telegram ID');
      }
      if (!users.has(user.userId)) users.set(user.userId, user);
    }
    onProgress?.(users.size, page.total);
    offset += page.users.length;
    if (!page.hasMore) return [...users.values()];
    if (!page.users.length) throw new Error('Не удалось получить следующую страницу. Повторите экспорт');
    if (offset >= MAX_ROWS) throw new Error('Слишком большая выгрузка. Уточните фильтры и повторите экспорт');
  }
}
