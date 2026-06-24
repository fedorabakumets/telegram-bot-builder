/**
 * @fileoverview Project-level операции над живой БД через API (проектный блок MCP)
 * @description Функции уровня проекта: листинг проектов владельца токена и др.
 * Ходят в API запущенного приложения через общий хелпер apiFetch (несёт
 * Authorization: Bearer из MCP_AGENT_TOKEN). Сервер фильтрует проекты по личности
 * владельца токена и уже вырезает секреты (botToken/sessionId) через DTO.
 * @module lib/bot-tools/project-ops-db
 */

import { apiFetch } from './api-fetch.ts';
import type { ReadDbOptions } from './node-query-db.ts';
import { scaffoldMinimalProject } from './project-mutate.ts';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

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
}

/**
 * Возвращает список проектов владельца токена из живой БД (read-only).
 * Единственный db-тул без project_id — нужен для дискавери: по нему агент узнаёт
 * id проектов для остальных тулов. Отдаёт только лёгкие безопасные поля.
 * @param options - Опции чтения (URL API)
 * @returns Число проектов и массив лёгких метаданных, либо ошибка
 */
export async function listProjectsInDb(
  options?: ReadDbOptions,
): Promise<{ total: number; projects: ProjectMetaDto[] } | { error: string }> {
  let res: Response;
  try {
    res = await apiFetch('/api/projects/list', { apiBaseUrl: options?.apiBaseUrl });
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
  }));

  return { total: projects.length, projects };
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
  options?: ReadDbOptions,
): Promise<{ ok: true; projectId: number; name: string } | { error: string }> {
  const data = scaffoldMinimalProject().project;

  let res: Response;
  try {
    res = await apiFetch('/api/projects', {
      apiBaseUrl: options?.apiBaseUrl,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, data }),
    });
  } catch (err) {
    return { error: `Не удалось соединиться с сервером: ${(err as Error).message}` };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    return { error: body ? `HTTP ${res.status}: ${body}` : `HTTP ${res.status}` };
  }

  let body: { id?: number; name?: string };
  try {
    body = (await res.json()) as { id?: number; name?: string };
  } catch (err) {
    return { error: `Не удалось разобрать ответ сервера: ${(err as Error).message}` };
  }

  if (typeof body.id !== 'number') return { error: 'В ответе сервера нет id нового проекта' };

  return { ok: true, projectId: body.id, name: body.name ?? name };
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
): Promise<{ ok: true; projectId: number; name: string } | { error: string }> {
  let res: Response;
  try {
    res = await apiFetch(`/api/projects/${projectId}`, {
      apiBaseUrl: options?.apiBaseUrl,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
  } catch (err) {
    return { error: `Не удалось соединиться с сервером: ${(err as Error).message}` };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 404) return { error: `HTTP 404: проект не найден${body ? `: ${body}` : ''}` };
    return { error: body ? `HTTP ${res.status}: ${body}` : `HTTP ${res.status}` };
  }

  let body: { name?: string };
  try {
    body = (await res.json()) as { name?: string };
  } catch (err) {
    return { error: `Не удалось разобрать ответ сервера: ${(err as Error).message}` };
  }

  return { ok: true, projectId, name: body.name ?? name };
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
): Promise<{ ok: true } | { error: string }> {
  if (!Array.isArray(projectIds) || projectIds.length === 0 || !projectIds.every((id) => typeof id === 'number')) {
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
    return { error: `Не удалось соединиться с сервером: ${(err as Error).message}` };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    return { error: body ? `HTTP ${res.status}: ${body}` : `HTTP ${res.status}` };
  }

  return { ok: true };
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
  | { ok: true; path: string; bytes: number; lines: number; preview: string; code?: string }
  | { error: string }
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

  if (typeof body.code !== 'string') return { error: 'В ответе нет кода' };
  const code = body.code;

  try {
    await fs.mkdir(path.dirname(target.resolved), { recursive: true });
    await fs.writeFile(target.resolved, code, 'utf8');
  } catch (err) {
    return { error: `Не удалось записать файл: ${(err as Error).message}` };
  }

  const allLines = code.split('\n');
  const preview = allLines.slice(0, 20).join('\n');

  return {
    ok: true,
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
): Promise<{ deleted: true; message: string } | { error: string }> {
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
    return { error: `Не удалось соединиться с сервером: ${(err as Error).message}` };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 404) return { error: `HTTP 404: проект не найден${body ? `: ${body}` : ''}` };
    return { error: body ? `HTTP ${res.status}: ${body}` : `HTTP ${res.status}` };
  }

  let body: { message?: string };
  try {
    body = (await res.json()) as { message?: string };
  } catch (err) {
    return { error: `Не удалось разобрать ответ сервера: ${(err as Error).message}` };
  }

  return { deleted: true, message: body.message ?? 'Проект удалён' };
}
