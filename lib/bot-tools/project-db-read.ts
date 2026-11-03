/**
 * @fileoverview Чтение сценария бота из БД запущенного приложения через HTTP API
 * @description Используется node-level MCP-инструментами live-редактирования: проект
 * читается через GET /api/projects/:id, чтобы применить одну node-операцию к актуальным
 * данным холста перед записью обратно.
 * @module lib/bot-tools/project-db-read
 */

import type { BotDataWithSheets } from '@shared/schema';
import { apiFetch } from './api-fetch.ts';

/**
 * Опции чтения проекта из БД через HTTP API
 */
export interface FetchProjectFromDbOptions {
  /** Базовый URL API (по умолчанию API_BASE_URL или http://localhost:5000) */
  apiBaseUrl?: string;
}

/** Успешный результат чтения проекта из БД */
export interface FetchProjectFromDbSuccess {
  /** Данные проекта (BotDataWithSheets) */
  data: BotDataWithSheets;
  /** Ревизия прочитанного снимка для защиты последующей записи */
  revision: number;
}

/** Результат чтения проекта с ошибкой */
export interface FetchProjectFromDbError {
  /** Текст ошибки */
  error: string;
}

/** Объединённый тип возврата fetchProjectFromDb */
export type FetchProjectFromDbResult = FetchProjectFromDbSuccess | FetchProjectFromDbError;

/**
 * Читает сценарий проекта из БД запущенного приложения через GET /api/projects/:id.
 * Возвращает поле data и ревизию исходного снимка или ошибку. Запись не выполняется.
 * @param projectId - Числовой ID проекта из URL редактора
 * @param options - Опции чтения (URL API)
 * @returns Данные проекта или ошибка
 */
export async function fetchProjectFromDb(
  projectId: number,
  options?: FetchProjectFromDbOptions,
): Promise<FetchProjectFromDbResult> {
  let res: Response;
  try {
    res = await apiFetch(`/api/projects/${projectId}`, { apiBaseUrl: options?.apiBaseUrl });
  } catch (err) {
    return { error: `Не удалось соединиться с сервером: ${(err as Error).message}` };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    return { error: body ? `HTTP ${res.status}: ${body}` : `HTTP ${res.status}` };
  }

  let body: { data?: BotDataWithSheets; revision?: number };
  try {
    body = (await res.json()) as { data?: BotDataWithSheets; revision?: number };
  } catch (err) {
    return { error: `Не удалось разобрать ответ сервера: ${(err as Error).message}` };
  }

  if (!body.data) {
    return { error: 'В ответе нет data проекта' };
  }

  if (!Number.isSafeInteger(body.revision) || body.revision! < 0) return { error: "Сервер не вернул ревизию проекта; сохранение без защиты запрещено" };
  return { data: body.data, revision: body.revision! };
}
