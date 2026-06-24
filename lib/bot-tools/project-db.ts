/**
 * @fileoverview Запись сценария бота в БД запущенного приложения через HTTP API
 * @description Используется MCP-инструментом для live-редактирования: проект пишется
 * в БД через PUT /api/projects/:id, сервер вещает правку на открытый холст.
 * @module lib/bot-tools/project-db
 */

import type { BotDataWithSheets } from '@shared/schema';
import { validateBotProject } from './validate-project.ts';
import type { ValidateProjectResult } from './types.ts';

/**
 * Опции записи проекта в БД через HTTP API
 */
export interface UpdateProjectInDbOptions {
  /** Базовый URL API (по умолчанию API_BASE_URL или http://localhost:5000) */
  apiBaseUrl?: string;
  /** Заметка к версии (непустая → ручной чекпоинт kind='manual') */
  commitMessage?: string;
  /** Пропустить блокировку записи невалидного проекта */
  skipValidation?: boolean;
  /** ID сессии агента (для actor на холсте) */
  agentSessionId?: string;
  /** Отображаемое имя агента (для бейджа на холсте) */
  agentDisplayName?: string;
}

/** Успешный результат записи проекта в БД */
export interface UpdateProjectInDbSuccess {
  /** Признак успеха */
  ok: true;
  /** ID обновлённого проекта */
  projectId: number;
  /** HTTP-статус ответа сервера */
  status: number;
}

/** Результат записи проекта с ошибкой */
export interface UpdateProjectInDbError {
  /** Текст ошибки */
  error: string;
  /** Результат валидации (если ошибка валидации) */
  validation?: ValidateProjectResult;
  /** HTTP-статус ответа сервера (если ошибка на стороне сервера) */
  status?: number;
  /** Тело ответа сервера (если ошибка на стороне сервера) */
  body?: string;
}

/** Объединённый тип возврата updateProjectInDb */
export type UpdateProjectInDbResult = UpdateProjectInDbSuccess | UpdateProjectInDbError;

/**
 * Парсит project_json в объект (строка → JSON.parse, объект → structuredClone)
 * @param input - Объект или JSON-строка
 * @returns project или null при невалидном вводе
 */
function parseProject(input: unknown): BotDataWithSheets | null {
  if (typeof input === 'string') {
    try {
      return JSON.parse(input) as BotDataWithSheets;
    } catch {
      return null;
    }
  }
  if (input && typeof input === 'object') return structuredClone(input) as BotDataWithSheets;
  return null;
}

/**
 * Пишет сценарий проекта в БД запущенного приложения через PUT /api/projects/:id.
 * Сервер сохраняет данные, снимает версию и вещает правку на открытый холст
 * с actor.kind='agent' (live-редактирование).
 * @param projectId - Числовой ID проекта из URL редактора
 * @param projectJson - Объект project.json или JSON-строка
 * @param options - Опции записи (URL API, заметка к версии, данные агента)
 * @returns Результат успеха или ошибки
 */
export async function updateProjectInDb(
  projectId: number,
  projectJson: unknown,
  options?: UpdateProjectInDbOptions,
): Promise<UpdateProjectInDbResult> {
  const project = parseProject(projectJson);
  if (!project) return { error: 'Невалидный project_json' };

  const validation = validateBotProject(project);
  if (!validation.valid && !options?.skipValidation) {
    return { error: 'Проект не прошёл валидацию', validation };
  }

  const baseUrl = options?.apiBaseUrl ?? process.env.API_BASE_URL ?? 'http://localhost:5000';

  try {
    const res = await fetch(`${baseUrl}/api/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: project,
        agentEdit: true,
        agentSessionId: options?.agentSessionId,
        agentDisplayName: options?.agentDisplayName,
        commitMessage: options?.commitMessage,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { error: `HTTP ${res.status}`, status: res.status, body };
    }

    return { ok: true, projectId, status: res.status };
  } catch (err) {
    return { error: `Не удалось соединиться с сервером: ${(err as Error).message}` };
  }
}
