/** @fileoverview Общие настройки данных, логов, поведения и webhook для ботов проекта. */

import { eq } from 'drizzle-orm';
import { resolveBotLaunchMode } from '@shared/bot-launch-mode';
import { resolveProjectBotSettings } from '@shared/bot-inherited-settings';
import { botProjects, botTokens } from '@shared/schema';
import { db } from '../database/db';
import { resolveWebhookBaseUrl } from './webhookBaseUrl';

/** Полный набор значений, используемый наследующими ботами. */
export type ProjectBotSettingDefaults = ReturnType<typeof resolveProjectBotSettings>;

/** У наследующего бота отсутствует базовый адрес для уже настроенного webhook. */
export class ProjectBotSettingDefaultsConflict extends Error {}

/**
 * Возвращает эффективные настройки проекта без индивидуальных настроек ботов.
 * @param projectId - Идентификатор проекта.
 * @returns Общие настройки либо null, если проект не найден.
 */
export async function getProjectBotSettingDefaults(projectId: number): Promise<ProjectBotSettingDefaults | null> {
  const [project] = await db.select({ defaults: botProjects.botSettingDefaults }).from(botProjects)
    .where(eq(botProjects.id, projectId));
  return project ? resolveProjectBotSettings(project.defaults) : null;
}

/**
 * Записывает только изменённые поля и проверяет итоговый адрес наследующих ботов.
 * @param projectId - Идентификатор проекта.
 * @param changes - Явно сохранённые настройки проекта.
 * @returns Эффективные настройки после записи либо null, если проект не найден.
 */
export async function saveProjectBotSettingDefaults(
  projectId: number,
  changes: Partial<ProjectBotSettingDefaults>,
): Promise<ProjectBotSettingDefaults | null> {
  return db.transaction(async (tx) => {
    const [project] = await tx.select({ defaults: botProjects.botSettingDefaults, launchMode: botProjects.defaultLaunchMode })
      .from(botProjects).where(eq(botProjects.id, projectId)).for('update');
    if (!project) return null;
    const next = { ...project.defaults, ...changes };
    /** При удалении адреса у наследующих ботов остаётся доступным только серверный адрес. */
    if (changes.webhookBaseUrl === null && !resolveWebhookBaseUrl()) {
      const tokens = await tx.select({ id: botTokens.id, launchMode: botTokens.launchMode,
        inheritLaunchMode: botTokens.inheritLaunchMode, inheritBotSettings: botTokens.inheritBotSettings })
        .from(botTokens).where(eq(botTokens.projectId, projectId)).orderBy(botTokens.id).for('update');
      const conflict = tokens.find((token) => token.inheritBotSettings?.includes('webhookBaseUrl')
        && resolveBotLaunchMode(project.launchMode, token.launchMode, token.inheritLaunchMode) === 'webhook');
      if (conflict) {
        throw new ProjectBotSettingDefaultsConflict(`Боту №${conflict.id} нужен базовый адрес для webhook`);
      }
    }
    await tx.update(botProjects).set({ botSettingDefaults: next }).where(eq(botProjects.id, projectId));
    return resolveProjectBotSettings(next);
  });
}
