/** @fileoverview Выборка метаданных истории с точным курсором PostgreSQL без чтения снимков. */
import { and, count, desc, eq, getTableColumns, sql } from 'drizzle-orm';
import { projectVersions, type ProjectVersion } from '@shared/schema';
import type { db } from './db';

/** Метаданные версии без тяжёлого снимка. */
export type ProjectVersionMetadata = Omit<ProjectVersion, 'snapshot'>;
/** Параметры страницы истории. */
export interface ProjectVersionPageOptions {
  /** Максимальное число записей. */
  limit: number;
  /** Непрозрачный курсор предыдущей страницы. */
  cursor?: string;
}
/** Страница метаданных истории. */
export interface ProjectVersionPage {
  /** Записи страницы без снимков. */
  items: ProjectVersionMetadata[];
  /** Курсор следующей страницы либо конец списка. */
  nextCursor: string | null;
  /** Общее число версий проекта. */
  total: number;
}
/** Поля таблицы, исключающие чтение TOAST-снимков. */
export const { snapshot: omittedSnapshot, ...versionMetadataColumns } = getTableColumns(projectVersions);

/** Проверяет и декодирует курсор, сохраняя микросекунды и область проекта. */
export function decodeVersionCursor(cursor: string, projectId: number): { id: number; timestamp: string | null } {
  try {
    if (cursor.length > 512) throw new Error();
    const value = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    if (value.projectId !== projectId || !Number.isSafeInteger(value.id) || value.id <= 0
      || !(value.timestamp === null || (typeof value.timestamp === 'string'
        && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d{1,6})?$/.test(value.timestamp)))) throw new Error();
    if (typeof value.timestamp === 'string') {
      const instant = new Date(value.timestamp.replace(' ', 'T') + 'Z');
      if (!Number.isFinite(instant.getTime()) || instant.toISOString().slice(0, 19)
        !== value.timestamp.slice(0, 19).replace(' ', 'T')) throw new Error();
    }
    return value;
  } catch { throw new Error('Некорректный курсор истории'); }
}

/** Создаёт условие продолжения: точная дата и ID разрешают совпадающие отметки времени. */
export function versionPageCondition(projectId: number, cursor?: string) {
  const scope = eq(projectVersions.projectId, projectId);
  if (!cursor) return scope;
  const value = decodeVersionCursor(cursor, projectId);
  const continuation = value.timestamp === null
    ? sql`${projectVersions.createdAt} is null and ${projectVersions.id} < ${value.id}`
    : sql`(${projectVersions.createdAt}, ${projectVersions.id}) < (${value.timestamp}::timestamp, ${value.id}) or ${projectVersions.createdAt} is null`;
  return and(scope, sql`(${continuation})`);
}

/** Получает метаданные; старый вызов сохраняет массив, новый ограничивает чтение страницей. */
export async function selectProjectVersionList(database: typeof db, projectId: number,
  options?: ProjectVersionPageOptions): Promise<ProjectVersionMetadata[] | ProjectVersionPage> {
  if (options && (!Number.isInteger(options.limit) || options.limit < 1 || options.limit > 100)) {
    throw new Error('Размер страницы должен быть от 1 до 100');
  }
  const query = database.select({ ...versionMetadataColumns,
    cursorTimestamp: sql<string | null>`to_char(${projectVersions.createdAt}, 'YYYY-MM-DD HH24:MI:SS.US')`,
  }).from(projectVersions).where(versionPageCondition(projectId, options?.cursor))
    .orderBy(sql`${projectVersions.createdAt} desc nulls last`, desc(projectVersions.id));
  const rows = await (options ? query.limit(options.limit + 1) : query);
  const visible = options ? rows.slice(0, options.limit) : rows;
  const items = visible.map(({ cursorTimestamp, ...metadata }) => metadata);
  if (!options) return items;
  const last = visible.at(-1);
  const nextCursor = rows.length > options.limit && last
    ? Buffer.from(JSON.stringify({ projectId, id: last.id, timestamp: last.cursorTimestamp })).toString('base64url') : null;
  const [aggregate] = await database.select({ total: count() }).from(projectVersions)
    .where(eq(projectVersions.projectId, projectId));
  return { items, nextCursor, total: aggregate.total };
}
