/**
 * @fileoverview Чтение истории версий проекта и откат к версии через живую БД приложения
 * @description Read-only список версий читается через GET /api/projects/:id/versions (только мета,
 * без snapshot). Откат (restore) тянет полную запись версии со snapshot через
 * GET /api/projects/:id/versions/:versionId и записывает её обратно через updateProjectInDb —
 * это даёт live-broadcast на открытый холст и создаёт новый чекпоинт-версию отката.
 * @module lib/bot-tools/version-ops-db
 */

import type { BotDataWithSheets } from '@shared/schema';
import { fetchProjectFromDb } from './project-db-read.ts';
import { updateProjectInDb, type UpdateProjectInDbResult } from './project-db.ts';
import type { ReadDbOptions } from './node-query-db.ts';
import { apiFetch } from './api-fetch.ts';
import { verifyMutation, type MutationResult } from './mutation-proof.ts';

/** Мета-запись версии проекта (без snapshot) */
export interface ProjectVersionMeta {
  /** Идентификатор версии */
  id: number;
  /** ID проекта, которому принадлежит версия */
  projectId: number;
  /** Заметка/название версии (может отсутствовать) */
  label: string | null;
  /** ID автора версии (может отсутствовать) */
  authorId: number | null;
  /** Отображаемое имя автора */
  authorName?: string;
  /** Тип автора: "user", "agent" и т.п. (может отсутствовать) */
  authorKind: string | null;
  /** Вид версии: "manual", "auto" и т.п. */
  kind: string;
  /** Дата создания версии в ISO-формате (может отсутствовать) */
  createdAt: string | null;
}

/**
 * Возвращает список версий проекта из живой БД (read-only, только мета без snapshot).
 * @param projectId - Числовой ID проекта из URL редактора
 * @param options - Опции чтения (URL API)
 * @returns Общее число версий и массив мета-записей, либо ошибка
 */
export async function listVersionsInDb(
  projectId: number,
  options?: ReadDbOptions,
): Promise<{ total: number; versions: ProjectVersionMeta[] } | { error: string }> {
  let res: Response;
  try {
    res = await apiFetch(`/api/projects/${projectId}/versions`, { apiBaseUrl: options?.apiBaseUrl });
  } catch (err) {
    return { error: `Не удалось соединиться с сервером: ${(err as Error).message}` };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    return { error: body ? `HTTP ${res.status}: ${body}` : `HTTP ${res.status}` };
  }

  let arr: ProjectVersionMeta[];
  try {
    arr = (await res.json()) as ProjectVersionMeta[];
  } catch (err) {
    return { error: `Не удалось разобрать ответ сервера: ${(err as Error).message}` };
  }

  return { total: arr.length, versions: arr };
}

/**
 * Откатывает проект к версии из истории через живую БД.
 * Читает полную запись версии (со snapshot) и записывает её обратно через updateProjectInDb,
 * что вещает правку на открытый холст и создаёт новый чекпоинт-версию отката.
 * @param projectId - Числовой ID проекта из URL редактора
 * @param versionId - ID версии, к которой откатываемся (из listVersionsInDb)
 * @param options - Опции отката (URL API, заметка к версии, пропуск валидации)
 * @returns Результат записи проекта (успех/ошибка)
 */
export async function restoreVersionInDb(
  projectId: number,
  versionId: number,
  options?: { apiBaseUrl?: string; commitMessage?: string; skipValidation?: boolean; expectedRevision?: number },
): Promise<UpdateProjectInDbResult> {
  let res: Response;
  try {
    res = await apiFetch(`/api/projects/${projectId}/versions/${versionId}`, { apiBaseUrl: options?.apiBaseUrl });
  } catch (err) {
    return { error: `Не удалось соединиться с сервером: ${(err as Error).message}` };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    return { error: `HTTP ${res.status}`, status: res.status, body };
  }

  let version: { snapshot?: unknown };
  try {
    version = (await res.json()) as { snapshot?: unknown };
  } catch (err) {
    return { error: `Не удалось разобрать ответ сервера: ${(err as Error).message}` };
  }

  const snapshot = version?.snapshot as BotDataWithSheets | undefined;
  if (!snapshot) return { error: 'В версии нет snapshot' };

  const current = await fetchProjectFromDb(projectId, options);
  if ('error' in current) return current;
  return updateProjectInDb(projectId, snapshot, {
    expectedRevision: options?.expectedRevision ?? current.revision,
    apiBaseUrl: options?.apiBaseUrl,
    commitMessage: options?.commitMessage ?? `Откат к версии #${versionId}`,
    skipValidation: options?.skipValidation ?? true,
  });
}

/**
 * Удаляет одну версию проекта из истории через живую БД (необратимо).
 * @param projectId - Числовой ID проекта из URL редактора
 * @param versionId - ID удаляемой версии (из listVersionsInDb)
 * @param options - Опции запроса (URL API)
 * @returns Признак удаления { deleted } либо ошибка { error }
 */
export async function deleteVersionInDb(
  projectId: number,
  versionId: number,
  options?: { apiBaseUrl?: string },
): Promise<MutationResult<{ deleted: boolean } | { error: string }>> {
  let res: Response;
  try {
    res = await apiFetch(`/api/projects/${projectId}/versions/${versionId}`, { apiBaseUrl: options?.apiBaseUrl, method: 'DELETE' });
  } catch (err) {
    return { error: `Связь прервана; перечитайте состояние перед повтором: ${(err as Error).message}`, outcome: "unknown" };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 404) return { error: `HTTP 404: версия не найдена${body ? `: ${body}` : ''}` };
    return { error: body ? `HTTP ${res.status}: ${body}` : `HTTP ${res.status}`, ...(res.status >= 500 ? { outcome: "unknown" as const } : {}) };
  }

  let body: { deleted?: boolean };
  try {
    body = (await res.json()) as { deleted?: boolean };
  } catch (err) {
    return { error: `Ответ не удалось прочитать; исход действия неизвестен: ${(err as Error).message}`, outcome: "unknown" };
  }

  if (body.deleted !== true) return { error: 'Сервер не подтвердил удаление версии', outcome: 'unknown' };
  return verifyMutation({ deleted: true }, `/api/projects/${projectId}/versions/${versionId}`, () => false, { ...options, absent: true });
}

/**
 * Массово удаляет версии проекта из истории по фильтру через живую БД (необратимо).
 * @param projectId - Числовой ID проекта из URL редактора
 * @param options - Опции: URL API, keep (сколько последних сохранить), kind (вид версии), authorKind (тип автора)
 * @returns Число удалённых версий { deleted } либо ошибка { error }
 */
export async function pruneVersionsInDb(
  projectId: number,
  options?: { apiBaseUrl?: string; keep?: number; kind?: 'auto' | 'manual'; authorKind?: 'agent' | 'user' },
): Promise<MutationResult<{ deleted: number } | { error: string }>> {
  let res: Response;
  try {
    res = await apiFetch(`/api/projects/${projectId}/versions/prune`, {
      apiBaseUrl: options?.apiBaseUrl,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keep: options?.keep, kind: options?.kind, authorKind: options?.authorKind }),
    });
  } catch (err) {
    return { error: `Связь прервана; перечитайте состояние перед повтором: ${(err as Error).message}`, outcome: "unknown" };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    return { error: body ? `HTTP ${res.status}: ${body}` : `HTTP ${res.status}`, ...(res.status >= 500 ? { outcome: "unknown" as const } : {}) };
  }

  let body: { deleted?: number; persistence?: { confirmed?: boolean; affectedRows?: number; projectId?: number } };
  try {
    body = (await res.json()) as { deleted?: number; persistence?: { confirmed?: boolean; affectedRows?: number; projectId?: number } };
  } catch (err) {
    return { error: `Ответ не удалось прочитать; исход действия неизвестен: ${(err as Error).message}`, outcome: "unknown" };
  }

  if (!Number.isSafeInteger(body.deleted) || body.deleted! < 0 || body.persistence?.confirmed !== true || body.persistence.projectId !== projectId || body.persistence.affectedRows !== body.deleted) return { error: 'Сервер не подтвердил фактически удалённые версии', outcome: 'unknown' };
  return { deleted: body.deleted!, effect: 'application', outcome: 'saved', persistence: { confirmed: true, method: 'returning' } };
}
