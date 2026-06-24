/**
 * @fileoverview Чтение сценария бота из БД запущенного приложения через HTTP API
 * @description Используется node-level MCP-инструментами live-редактирования: проект
 * читается через GET /api/projects/:id, чтобы применить одну node-операцию к актуальным
 * данным холста перед записью обратно.
 * @module lib/bot-tools/project-db-read
 */

import type { BotDataWithSheets } from '@shared/schema';

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
 * Возвращает только поле data (BotDataWithSheets) или ошибку. Запись не выполняется.
 * @param projectId - Числовой ID проекта из URL редактора
 * @param options - Опции чтения (URL API)
 * @returns Данные проекта или ошибка
 */
export async function fetchProjectFromDb(
  projectId: number,
  options?: FetchProjectFromDbOptions,
): Promise<FetchProjectFromDbResult> {
  const baseUrl = options?.apiBaseUrl ?? process.env.API_BASE_URL ?? 'http://localhost:5000';

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/api/projects/${projectId}`);
  } catch (err) {
    return { error: `Не удалось соединиться с сервером: ${(err as Error).message}` };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    return { error: body ? `HTTP ${res.status}: ${body}` : `HTTP ${res.status}` };
  }

  let body: { data?: BotDataWithSheets };
  try {
    body = (await res.json()) as { data?: BotDataWithSheets };
  } catch (err) {
    return { error: `Не удалось разобрать ответ сервера: ${(err as Error).message}` };
  }

  if (!body.data) {
    return { error: 'В ответе нет data проекта' };
  }

  return { data: body.data };
}
