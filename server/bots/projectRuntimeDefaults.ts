/** @fileoverview Общие настройки обработчика и автоперезапуска ботов проекта. */

import { eq } from 'drizzle-orm';
import { botProjects } from '@shared/schema';
import { db } from '../database/db';

/** Общие параметры запуска и восстановления ботов проекта. */
export interface ProjectRuntimeDefaults {
  /** Режим обработчика проекта; null в старых записях означает включённый сон. */
  sleepMode: 'direct' | 'process' | null;
  /** Признак автоматического запуска после сбоя. */
  autoRestart: number;
  /** Максимальное число попыток автоматического запуска. */
  maxRestartAttempts: number;
}

/** Колонки настроек проекта, которые доступны в ответе API. */
const runtimeColumns = {
  sleepMode: botProjects.defaultSleepMode,
  autoRestart: botProjects.defaultAutoRestart,
  maxRestartAttempts: botProjects.defaultMaxRestartAttempts,
};

/**
 * Читает сохранённые проектные настройки.
 * @param projectId - Идентификатор проекта.
 * @returns Общие настройки либо null, если проект не найден.
 */
export async function getProjectRuntimeDefaults(projectId: number): Promise<ProjectRuntimeDefaults | null> {
  const [project] = await db.select(runtimeColumns).from(botProjects).where(eq(botProjects.id, projectId));
  return project ?? null;
}

/**
 * Сохраняет изменённые поля одним запросом для следующих запусков.
 * @param projectId - Идентификатор проекта.
 * @param changes - Новые значения только изменённых полей.
 * @returns Настройки после сохранения либо null, если проект не найден.
 */
export async function saveProjectRuntimeDefaults(
  projectId: number,
  changes: Partial<ProjectRuntimeDefaults>,
): Promise<ProjectRuntimeDefaults | null> {
  /** Прежний запрос со значением null сохраняет включённый сон. */
  const [updated] = await db.update(botProjects).set({
    defaultSleepMode: changes.sleepMode === null ? 'process' : changes.sleepMode,
    defaultAutoRestart: changes.autoRestart,
    defaultMaxRestartAttempts: changes.maxRestartAttempts,
  }).where(eq(botProjects.id, projectId)).returning(runtimeColumns);
  return updated ?? null;
}
