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
