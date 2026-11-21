/** @fileoverview Хранение общего способа получения обновлений ботов проекта. */

import { and, eq, inArray, sql } from 'drizzle-orm';
import { resolveBotInheritedSettings } from '@shared/bot-inherited-settings';
import { botEnvVariables, botProjects, botTokens } from '@shared/schema';
import { db } from '../database/db';
import { cachedOps } from '../database/db-cache';
import { resolveRuntimeModeSettings, RuntimeModeValidationError, validateRuntimeMode } from './runtimeModePolicy';
import { resolveWebhookBaseUrl } from './webhookBaseUrl';

/** Способ получения обновлений Telegram. */
export type ProjectLaunchMode = 'polling' | 'webhook';

/** Общий режим и число ботов с каждым источником настройки. */
export interface ProjectLaunchDefault {
  /** Общий способ получения обновлений. */
  launchMode: ProjectLaunchMode;
  /** Число ботов, использующих общий способ. */
  inheritedCount: number;
  /** Число ботов с индивидуальной настройкой. */
  overrideCount: number;
}

/** Общий режим несовместим с настройками наследующего бота. */
export class ProjectLaunchDefaultConflict extends Error {}

/**
 * Читает общий режим и количество ботов в одном снимке базы.
 * @param projectId - Идентификатор проекта.
 * @returns Настройки проекта либо null, если он удалён.
 */
export async function getProjectLaunchDefault(projectId: number): Promise<ProjectLaunchDefault | null> {
  const [row] = await db.select({
    mode: botProjects.defaultLaunchMode,
    inheritedCount: sql<number>`count(${botTokens.id}) filter (where ${botTokens.inheritLaunchMode} is true)`.mapWith(Number),
    overrideCount: sql<number>`count(${botTokens.id}) filter (where ${botTokens.inheritLaunchMode} is not true)`.mapWith(Number),
  }).from(botProjects).leftJoin(botTokens, eq(botTokens.projectId, botProjects.id))
    .where(eq(botProjects.id, projectId)).groupBy(botProjects.id);
  return row ? {
    launchMode: row.mode === 'webhook' ? 'webhook' : 'polling',
    inheritedCount: row.inheritedCount,
    overrideCount: row.overrideCount,
  } : null;
}

/**
 * Проверяет итоговый транспорт и сохраняет настройку в одной транзакции.
 * @param projectId - Идентификатор проекта.
 * @param launchMode - Новый общий способ получения обновлений.
 * @returns Сохранённые настройки проекта либо null, если он удалён.
 */
export async function saveProjectLaunchDefault(projectId: number, launchMode: ProjectLaunchMode): Promise<ProjectLaunchDefault | null> {
  const result = await db.transaction(async (tx) => {
    const [project] = await tx.select({ sleepMode: botProjects.defaultSleepMode, botSettingDefaults: botProjects.botSettingDefaults }).from(botProjects)
      .where(eq(botProjects.id, projectId)).for('update');
    if (!project) return null;
    const tokens = await tx.select({
      id: botTokens.id,
      inherits: botTokens.inheritLaunchMode,
      inheritSleepMode: botTokens.inheritSleepMode,
      webhookBaseUrl: botTokens.webhookBaseUrl,
      inheritBotSettings: botTokens.inheritBotSettings,
    }).from(botTokens).where(eq(botTokens.projectId, projectId)).orderBy(botTokens.id).for('update');
    const inherited = tokens.filter((token) => token.inherits === true);
    if (launchMode === 'webhook' && inherited.length > 0) {
      const variables = await tx.select({ tokenId: botEnvVariables.tokenId, key: botEnvVariables.key, value: botEnvVariables.value })
        .from(botEnvVariables).where(and(inArray(botEnvVariables.tokenId, inherited.map((token) => token.id)),
          eq(botEnvVariables.key, 'BOT_POLLING_MODE'))).orderBy(botEnvVariables.id);
      const modesByToken = new Map(variables.map((item) => [item.tokenId, item]));
      for (const token of inherited) {
        const { webhookBaseUrl } = resolveBotInheritedSettings(project.botSettingDefaults, token);
        if (!resolveWebhookBaseUrl(webhookBaseUrl)) {
          throw new ProjectLaunchDefaultConflict(`Для бота №${token.id} требуется публичный базовый адрес webhook`);
        }
        try {
          const ownMode = modesByToken.get(token.id);
          const { mode } = resolveRuntimeModeSettings(
            ownMode ? [ownMode] : [], launchMode, process.env, token.id, project.sleepMode, token.inheritSleepMode,
          );
          validateRuntimeMode(mode, launchMode);
        } catch (error) {
          if (!(error instanceof RuntimeModeValidationError)) throw error;
          throw new ProjectLaunchDefaultConflict(`Бот №${token.id}: ${error.message}`);
        }
      }
    }
    await tx.update(botProjects).set({ defaultLaunchMode: launchMode }).where(eq(botProjects.id, projectId));
    return { launchMode, inheritedCount: inherited.length, overrideCount: tokens.length - inherited.length };
  });
  // Сброс после commit исключает запуск со старым транспортом из пяти минутного кеша.
  if (result) cachedOps.invalidateProject(projectId);
  return result;
}
