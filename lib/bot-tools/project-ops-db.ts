/**
 * @fileoverview Project-level операции над живой БД через API (проектный блок MCP)
 * @description Функции уровня проекта: листинг проектов владельца токена и др.
 * Ходят в API запущенного приложения через общий хелпер apiFetch (несёт
 * Authorization: Bearer из MCP_AGENT_TOKEN). Сервер фильтрует проекты по личности
 * владельца токена и уже вырезает секреты (botToken/sessionId) через DTO.
 * @module lib/bot-tools/project-ops-db
 */

import { apiFetch } from './api-fetch.ts';
import { verifyMutation, durableMutationUnknown, type MutationResult } from './mutation-proof.ts';
import type { ReadDbOptions } from './node-query-db.ts';
import { scaffoldMinimalProject } from './project-mutate.ts';
import { atomicWriteVerified, type LocalFileReceipt } from './atomic-local-file.ts';
import * as path from 'node:path';
import { isDeepStrictEqual } from 'node:util';

/** Лёгкая метаинформация о проекте для агента (whitelist безопасных полей) */
export interface ProjectMetaDto {
  /** Числовой ID проекта (нужен для остальных db_-тулов) */
  id: number;
  /** Название проекта */
  name: string;
  /** Описание проекта */
  description: string | null;
  /** Число нод во всех листах */
  nodeCount: number;
  /** Число листов */
  sheetsCount: number;
  /** Порядок сортировки в списке */
  sortOrder: number | null;
  /** Дата последнего обновления (ISO-строка) */
  updatedAt: string | null;
  /** Заархивирован ли проект для владельца токена */
  isArchivedForMe: boolean;
}

/** Сырой элемент ответа GET /api/projects/list (после серверного DTO, без секретов) */
interface RawProjectListItem {
  /** ID проекта */
  id: number;
  /** Имя */
  name: string;
  /** Описание */
  description?: string | null;
  /** Число нод */
  nodeCount?: number;
  /** Число листов */
  sheetsCount?: number;
  /** Порядок сортировки */
  sortOrder?: number | null;
  /** Дата обновления */
  updatedAt?: string | null;
  /** Личный архив для владельца токена */
  isArchivedForMe?: boolean;
}

/**
 * Возвращает список проектов владельца токена из живой БД (read-only).
 * Единственный db-тул без project_id — нужен для дискавери: по нему агент узнаёт
 * id проектов для остальных тулов. Отдаёт только лёгкие безопасные поля.
 * @param options - Опции: URL API и фильтр archived (false — активные, true — архив)
 * @returns Число проектов, фильтр и массив метаданных, либо ошибка
 */
export async function listProjectsInDb(
  options?: ReadDbOptions & { archived?: boolean },
): Promise<
  { total: number; archived: boolean; projects: ProjectMetaDto[] } | { error: string }
> {
  const archived = options?.archived ?? false;
  const query = archived ? '?archived=true' : '?archived=false';

  let res: Response;
  try {
    res = await apiFetch(`/api/projects/list${query}`, { apiBaseUrl: options?.apiBaseUrl });
  } catch (err) {
    return { error: `Не удалось соединиться с сервером: ${(err as Error).message}` };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    return { error: body ? `HTTP ${res.status}: ${body}` : `HTTP ${res.status}` };
  }

  let arr: RawProjectListItem[];
  try {
    arr = (await res.json()) as RawProjectListItem[];
  } catch (err) {
    return { error: `Не удалось разобрать ответ сервера: ${(err as Error).message}` };
  }

  const projects: ProjectMetaDto[] = arr.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description ?? null,
    nodeCount: p.nodeCount ?? 0,
    sheetsCount: p.sheetsCount ?? 0,
    sortOrder: p.sortOrder ?? null,
    updatedAt: p.updatedAt ?? null,
    isArchivedForMe: p.isArchivedForMe ?? archived,
  }));

  return { total: projects.length, archived, projects };
}

/**
 * Создаёт новый проект с дефолтным сценарием (/start → приветствие) в живой БД.
 * Сценарий генерируется через scaffoldMinimalProject и шлётся в поле data.
 * ⚠️ Ответ сервера содержит полный проект с секретом botToken — наружу
 * возвращаются только безопасные поля { ok, projectId, name }.
 * @param name - Название нового проекта
 * @param options - Опции запроса (URL API)
 * @returns Признак успеха с id и именем нового проекта, либо ошибка
 */
export async function createProjectInDb(
  name: string,
  options?: ReadDbOptions & { requestId?: string },
): Promise<MutationResult<{ ok: true; projectId: number; name: string } | { error: string }>> {
  const data = scaffoldMinimalProject().project;
  // Одна заявка должна иметь одинаковый JSON даже после перезапуска процесса.
  if (options?.requestId) {
    const sheetId = `mcp-sheet-${options.requestId}`;
    data.sheets[0].id = sheetId;
    data.activeSheetId = sheetId;
  }

  let res: Response;
  try {
    res = await apiFetch('/api/projects', {
      apiBaseUrl: options?.apiBaseUrl,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, data, ...(options?.requestId ? { requestId: options.requestId } : {}) }),
    });
  } catch (err) {
    return { error: `Связь прервана; перечитайте состояние перед повтором: ${(err as Error).message}`, outcome: "unknown" };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    return { error: body ? `HTTP ${res.status}: ${body}` : `HTTP ${res.status}`, ...(res.status >= 500 ? { outcome: "unknown" as const } : {}) };
  }

  let body: { id?: number; name?: string };
  try {
    body = (await res.json()) as { id?: number; name?: string };
  } catch (err) {
    return { error: `Ответ не удалось прочитать; исход действия неизвестен: ${(err as Error).message}`, outcome: "unknown" };
  }

  if (res.status === 202) return durableMutationUnknown(body);

  if (typeof body?.id !== 'number') return { error: 'В ответе сервера нет id нового проекта' };

  return verifyMutation({ ok: true as const, projectId: body.id, name: body.name ?? name }, `/api/projects/${body.id}`, value => value?.id === body.id && value?.name === (body.name ?? name) && isDeepStrictEqual(value?.data, data), options);
}

/**
 * Переименовывает проект в живой БД через PUT /api/projects/:id.
 * Шлёт ТОЛЬКО { name } (без data) — сознательно, чтобы не плодить версии и
 * не вызывать broadcast правки сценария на холст.
 * ⚠️ Ответ сервера содержит полный проект с секретом botToken — наружу
 * возвращаются только безопасные поля { ok, projectId, name }.
 * @param projectId - Числовой ID проекта из URL редактора
 * @param name - Новое имя проекта
 * @param options - Опции запроса (URL API)
 * @returns Признак успеха с id и новым именем, либо ошибка
 */
export async function renameProjectInDb(
  projectId: number,
  name: string,
  options?: ReadDbOptions,
): Promise<MutationResult<{ ok: true; projectId: number; name: string } | { error: string }>> {
  let res: Response;
  try {
    res = await apiFetch(`/api/projects/${projectId}`, {
      apiBaseUrl: options?.apiBaseUrl,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
  } catch (err) {
    return { error: `Связь прервана; перечитайте состояние перед повтором: ${(err as Error).message}`, outcome: "unknown" };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 404) return { error: `HTTP 404: проект не найден${body ? `: ${body}` : ''}` };
    return { error: body ? `HTTP ${res.status}: ${body}` : `HTTP ${res.status}`, ...(res.status >= 500 ? { outcome: "unknown" as const } : {}) };
  }

  let body: { name?: string };
  try {
    body = (await res.json()) as { name?: string };
  } catch (err) {
    return { error: `Ответ не удалось прочитать; исход действия неизвестен: ${(err as Error).message}`, outcome: "unknown" };
  }

  return verifyMutation({ ok: true as const, projectId, name: body.name ?? name }, `/api/projects/${projectId}`, value => value?.id === projectId && value?.name === name, options);
}

/**
 * Изменяет порядок проектов в списке владельца через PUT /api/projects/reorder.
 * @param projectIds - Полный список id проектов в нужном порядке
 * @param options - Опции запроса (URL API)
 * @returns Признак успеха { ok } либо ошибка { error }
 */
export async function reorderProjectsInDb(
  projectIds: number[],
  options?: ReadDbOptions,
): Promise<MutationResult<{ ok: true } | { error: string }>> {
  if (!Array.isArray(projectIds) || projectIds.length === 0 || !projectIds.every((id) => Number.isSafeInteger(id) && id > 0) || new Set(projectIds).size !== projectIds.length) {
    return { error: 'projectIds должен быть непустым массивом чисел' };
  }

  let res: Response;
  try {
    res = await apiFetch('/api/projects/reorder', {
      apiBaseUrl: options?.apiBaseUrl,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectIds }),
    });
  } catch (err) {
    return { error: `Связь прервана; перечитайте состояние перед повтором: ${(err as Error).message}`, outcome: "unknown" };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    return { error: body ? `HTTP ${res.status}: ${body}` : `HTTP ${res.status}`, ...(res.status >= 500 ? { outcome: "unknown" as const } : {}) };
  }

  for (const [index, id] of projectIds.entries()) {
    const check = await verifyMutation({ ok: true as const }, `/api/projects/${id}`, value => value?.id === id && value?.sortOrder === index, options);
    if ('error' in check) return check;
  }
  return { ok: true, effect: 'application', outcome: 'saved', persistence: { confirmed: true, method: 'readback', resource: '/api/projects/reorder' } };
}

/**
 * Резолвит безопасный путь к bot.py внутри каталога bots/ (защита от выхода за пределы).
 * Если userPath оканчивается на .py — берётся как есть; иначе трактуется как папка
 * и дополняется /bot.py. Без userPath — дефолт bots/exported/project_<id>/bot.py.
 * @param userPath - Папка или путь к .py внутри bots/ (опционально)
 * @param projectId - ID проекта для дефолтного имени папки
 * @returns Абсолютный путь или ошибка выхода за пределы bots/
 */
function resolveBotPyPath(
  userPath: string | undefined,
  projectId: number,
): { resolved: string } | { error: string } {
  const botsRoot = path.resolve(process.cwd(), 'bots');
  const rel = userPath && userPath.trim()
    ? (userPath.endsWith('.py') ? userPath : path.join(userPath, 'bot.py'))
    : path.join('exported', `project_${projectId}`, 'bot.py');
  const resolved = path.resolve(botsRoot, rel);

  if (!resolved.startsWith(botsRoot + path.sep)) {
    return { error: 'Путь вне каталога bots' };
  }
  return { resolved };
}

/**
 * Экспортирует проект в готовый Python-код бота (bot.py) через
 * POST /api/projects/:id/export и СОХРАНЯЕТ его на диск в каталог bots/.
 * Возвращает лёгкую сводку (путь, размер, число строк, превью первых строк),
 * а НЕ весь код — чтобы крупные боты не раздували контекст агента.
 * Полный код можно получить, прочитав файл, либо передав inline: true.
 * @param projectId - Числовой ID проекта из URL редактора
 * @param options - Опции: URL API, savePath (папка/.py внутри bots/), inline (вернуть и полный код)
 * @returns Сводка экспорта { ok, path, bytes, lines, preview, code? } либо ошибка
 */
export async function exportProjectInDb(
  projectId: number,
  options?: { apiBaseUrl?: string; savePath?: string; inline?: boolean },
): Promise<
  | ({ ok: true; path: string; bytes: number; lines: number; preview: string; code?: string } & LocalFileReceipt)
  | { error: string; outcome?: 'unknown' | 'error'; effect?: 'local_file' }
> {
  const target = resolveBotPyPath(options?.savePath, projectId);
  if ('error' in target) return target;

  let res: Response;
  try {
    res = await apiFetch(`/api/projects/${projectId}/export`, {
      apiBaseUrl: options?.apiBaseUrl,
      method: 'POST',
    });
  } catch (err) {
    return { error: `Не удалось соединиться с сервером: ${(err as Error).message}` };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 404) return { error: `HTTP 404: проект не найден${body ? `: ${body}` : ''}` };
    return { error: body ? `HTTP ${res.status}: ${body}` : `HTTP ${res.status}` };
  }

  let body: { code?: string };
  try {
    body = (await res.json()) as { code?: string };
  } catch (err) {
    return { error: `Не удалось разобрать ответ сервера: ${(err as Error).message}` };
  }

  if (typeof body?.code !== 'string') return { error: 'В ответе нет кода' };
  const code = body.code;

  let localReceipt: LocalFileReceipt;
  try {
    localReceipt = await atomicWriteVerified(target.resolved, code, path.resolve(process.cwd(), 'bots'));
  } catch (err) {
    return { error: `Не удалось подтвердить локальный файл: ${(err as Error).message}`, effect: "local_file", outcome: (err as { outcome?: "unknown" | "error" }).outcome ?? "unknown" };
  }

  const allLines = code.split('\n');
  const preview = allLines.slice(0, 20).join('\n');

  return {
    ok: true,
    ...localReceipt,
    path: target.resolved,
    bytes: Buffer.byteLength(code, 'utf8'),
    lines: allLines.length,
    preview,
    ...(options?.inline ? { code } : {}),
  };
}

/**
 * Удаляет проект целиком через DELETE /api/projects/:id (НЕОБРАТИМО):
 * сервер останавливает бота и удаляет все связанные данные.
 * Защита от случайного вызова: confirm-gate первой строкой — без confirm: true
 * HTTP-запрос не отправляется.
 * @param projectId - Числовой ID проекта из URL редактора
 * @param options - Опции: URL API и обязательное подтверждение confirm
 * @returns Признак удаления { deleted, message } либо ошибка { error }
 */
export async function deleteProjectInDb(
  projectId: number,
  options?: { apiBaseUrl?: string; confirm?: boolean },
): Promise<MutationResult<{ deleted: true; message: string } | { error: string }>> {
  if (options?.confirm !== true) {
    return { error: 'Удаление необратимо. Передайте confirm: true для подтверждения.' };
  }

  let res: Response;
  try {
    res = await apiFetch(`/api/projects/${projectId}`, {
      apiBaseUrl: options?.apiBaseUrl,
      method: 'DELETE',
    });
  } catch (err) {
    return { error: `Связь прервана; перечитайте состояние перед повтором: ${(err as Error).message}`, outcome: "unknown" };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 404) return { error: `HTTP 404: проект не найден${body ? `: ${body}` : ''}` };
    return { error: body ? `HTTP ${res.status}: ${body}` : `HTTP ${res.status}`, ...(res.status >= 500 ? { outcome: "unknown" as const } : {}) };
  }

  let body: { message?: string };
  try {
    body = (await res.json()) as { message?: string };
  } catch (err) {
    return { error: `Ответ не удалось прочитать; исход действия неизвестен: ${(err as Error).message}`, outcome: "unknown" };
  }

  return verifyMutation({ deleted: true as const, message: body.message ?? 'Проект удалён' }, `/api/projects/${projectId}`, () => false, { ...options, absent: true });
}

/**
 * Дублирует проект целиком через POST /api/projects/:id/duplicate.
 * Сервер создаёт полную копию сценария со всеми листами и связями и возвращает
 * безопасный DTO копии в форме элемента списка (без data/sessionId).
 * ⚠️ Bot token НЕ копируется — копия создаётся без токена (это поведение сервера).
 * Если name не передан — сервер сам подставит имя «{имя источника} (копия)».
 * @param sourceProjectId - Числовой ID проекта-источника
 * @param options - Опции запроса: URL API и опциональное имя копии
 * @returns Признак успеха с id и именем копии и id источника, либо ошибка
 */
export async function duplicateProjectInDb(
  sourceProjectId: number,
  options?: { apiBaseUrl?: string; name?: string; requestId?: string },
): Promise<MutationResult<{ ok: true; projectId: number; name: string; sourceProjectId: number } | { error: string }>> {
  let res: Response;
  try {
    res = await apiFetch(`/api/projects/${sourceProjectId}/duplicate`, {
      apiBaseUrl: options?.apiBaseUrl,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: options?.name, ...(options?.requestId ? { requestId: options.requestId } : {}) }),
    });
  } catch (err) {
    return { error: `Связь прервана; перечитайте состояние перед повтором: ${(err as Error).message}`, outcome: "unknown" };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 404) return { error: `HTTP 404: проект-источник не найден${body ? `: ${body}` : ''}` };
    return { error: body ? `HTTP ${res.status}: ${body}` : `HTTP ${res.status}`, ...(res.status >= 500 ? { outcome: "unknown" as const } : {}) };
  }

  let body: { id?: number; name?: string };
  try {
    body = (await res.json()) as { id?: number; name?: string };
  } catch (err) {
    return { error: `Ответ не удалось прочитать; исход действия неизвестен: ${(err as Error).message}`, outcome: "unknown" };
  }

  if (res.status === 202) return durableMutationUnknown(body);

  if (typeof body?.id !== 'number') return { error: 'В ответе сервера нет id копии' };

  return verifyMutation({ ok: true as const, projectId: body.id, name: body.name ?? '', sourceProjectId }, `/api/projects/${body.id}`, value => value?.id === body.id && value?.name === body.name, options);
}

/**
 * Помещает проект в личный архив владельца токена (боты не останавливаются).
 * @param projectId - Числовой ID проекта
 * @param options - Опции запроса (URL API)
 * @returns Признак успеха либо ошибка
 */
export async function archiveProjectInDb(
  projectId: number,
  options?: ReadDbOptions,
): Promise<MutationResult<{ ok: true; projectId: number; isArchivedForMe: true } | { error: string }>> {
  let res: Response;
  try {
    res = await apiFetch(`/api/projects/${projectId}/archive`, {
      apiBaseUrl: options?.apiBaseUrl,
      method: 'POST',
    });
  } catch (err) {
    return { error: `Связь прервана; перечитайте состояние перед повтором: ${(err as Error).message}`, outcome: "unknown" };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 404) return { error: `HTTP 404: проект не найден${body ? `: ${body}` : ''}` };
    return { error: body ? `HTTP ${res.status}: ${body}` : `HTTP ${res.status}`, ...(res.status >= 500 ? { outcome: "unknown" as const } : {}) };
  }

  return verifyMutation({ ok: true as const, projectId, isArchivedForMe: true as const }, '/api/projects/list?archived=true', value => Array.isArray(value) && value.some(item => item.id === projectId && item.isArchivedForMe === true), options);
}

/**
 * Возвращает проект из личного архива владельца токена.
 * @param projectId - Числовой ID проекта
 * @param options - Опции запроса (URL API)
 * @returns Признак успеха либо ошибка
 */
export async function unarchiveProjectInDb(
  projectId: number,
  options?: ReadDbOptions,
): Promise<MutationResult<{ ok: true; projectId: number; isArchivedForMe: false } | { error: string }>> {
  let res: Response;
  try {
    res = await apiFetch(`/api/projects/${projectId}/unarchive`, {
      apiBaseUrl: options?.apiBaseUrl,
      method: 'POST',
    });
  } catch (err) {
    return { error: `Связь прервана; перечитайте состояние перед повтором: ${(err as Error).message}`, outcome: "unknown" };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 404) return { error: `HTTP 404: проект не найден${body ? `: ${body}` : ''}` };
    return { error: body ? `HTTP ${res.status}: ${body}` : `HTTP ${res.status}`, ...(res.status >= 500 ? { outcome: "unknown" as const } : {}) };
  }

  return verifyMutation({ ok: true as const, projectId, isArchivedForMe: false as const }, '/api/projects/list?archived=false', value => Array.isArray(value) && value.some(item => item.id === projectId && item.isArchivedForMe !== true), options);
}
