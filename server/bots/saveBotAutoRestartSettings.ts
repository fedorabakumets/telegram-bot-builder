/** @fileoverview Запись индивидуальных настроек автоперезапуска выбранного бота. */
import { and, eq, inArray } from 'drizzle-orm';
import { botProjects, botTokens } from '@shared/schema';
import { resolveBotAutoRestart } from '../../shared/bot-execution-settings';
import { db } from '../database/db';
import type { BotAutoRestartPatch } from './botAutoRestartPatch';

/**
 * Записывает только запрошенные поля и возвращает их эффективные значения.
 * @param projectId - Идентификатор проекта.
 * @param tokenId - Идентификатор токена.
 * @param patch - Проверенные значения и признаки наследования.
 * @returns Настройки или null при отсутствии проекта или бота.
 */
export function saveBotAutoRestartSettings(projectId: number, tokenId: number, patch: BotAutoRestartPatch) {
  return db.transaction(async (tx) => {
    const [project] = await tx.select({
      defaultAutoRestart: botProjects.defaultAutoRestart,
      defaultMaxRestartAttempts: botProjects.defaultMaxRestartAttempts,
    }).from(botProjects).where(eq(botProjects.id, projectId)).for('update');
    if (!project) return null;
    const [token] = await tx.update(botTokens).set(patch)
      .where(and(eq(botTokens.projectId, projectId), eq(botTokens.id, tokenId))).returning({
        autoRestart: botTokens.autoRestart, maxRestartAttempts: botTokens.maxRestartAttempts,
        inheritAutoRestart: botTokens.inheritAutoRestart, inheritMaxRestartAttempts: botTokens.inheritMaxRestartAttempts,
      });
    if (!token) return null;
    const effective = resolveBotAutoRestart(project, token);
    return {
      autoRestart: effective.autoRestart ? 1 : 0,
      maxRestartAttempts: effective.maxRestartAttempts,
      inheritAutoRestart: token.inheritAutoRestart,
      inheritMaxRestartAttempts: token.inheritMaxRestartAttempts,
    };
  });
}

/**
 * Включает наследование выбранной настройки запуска одной транзакцией.
 * @param projectId - Идентификатор проекта.
 * @param tokenIds - Уникальные идентификаторы выбранных ботов.
 * @returns Идентификаторы обновлённых ботов или null, если список не принадлежит проекту.
 */
export function adoptProjectAutoRestart(projectId: number, tokenIds: number[]) {
  return db.transaction(async (tx) => {
    const [project] = await tx.select({ id: botProjects.id }).from(botProjects)
      .where(eq(botProjects.id, projectId)).for('update');
    if (!project) return null;
    const selected = and(eq(botTokens.projectId, projectId), inArray(botTokens.id, tokenIds));
    const tokens = await tx.select({ id: botTokens.id }).from(botTokens)
      .where(selected).orderBy(botTokens.id).for('update');
    if (tokens.length !== tokenIds.length) return null;
    /** Индивидуальное значение хранится отдельно и не участвует в наследовании. */
    const updated = await tx.update(botTokens).set({ inheritAutoRestart: true })
      .where(and(selected, eq(botTokens.inheritAutoRestart, false))).returning({ id: botTokens.id });
    return updated.map(({ id }) => id);
  });
}
