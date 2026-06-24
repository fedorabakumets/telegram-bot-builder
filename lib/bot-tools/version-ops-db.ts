/**
 * @fileoverview Чтение истории версий проекта и откат к версии через живую БД приложения
 * @description Read-only список версий читается через GET /api/projects/:id/versions (только мета,
 * без snapshot). Откат (restore) тянет полную запись версии со snapshot через
 * GET /api/projects/:id/versions/:versionId и записывает её обратно через updateProjectInDb —
 * это даёт live-broadcast на открытый холст и создаёт новый чекпоинт-версию отката.
 * @module lib/bot-tools/version-ops-db
 */

import type { BotDataWithSheets } from '@shared/schema';
import { updateProjectInDb, type UpdateProjectInDbResult } from './project-db.ts';
import type { ReadDbOptions } from './node-query-db.ts';

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
  const baseUrl = options?.apiBaseUrl ?? process.env.API_BASE_URL ?? 'http://localhost:5000';

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/api/projects/${projectId}/versions`);
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
  options?: { apiBaseUrl?: string; commitMessage?: string; skipValidation?: boolean },
): Promise<UpdateProjectInDbResult> {
  const baseUrl = options?.apiBaseUrl ?? process.env.API_BASE_URL ?? 'http://localhost:5000';

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/api/projects/${projectId}/versions/${versionId}`);
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

  return updateProjectInDb(projectId, snapshot, {
    apiBaseUrl: options?.apiBaseUrl,
    commitMessage: options?.commitMessage ?? `Откат к версии #${versionId}`,
    skipValidation: options?.skipValidation ?? true,
  });
}
