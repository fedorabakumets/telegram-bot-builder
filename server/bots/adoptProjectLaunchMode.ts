/** @fileoverview Атомарный перевод выбранных ботов на настройки запуска проекта. */
import { and, eq, inArray } from 'drizzle-orm';
import { botEnvVariables, botProjects, botTokens } from '@shared/schema';
import { BOT_INHERITED_SETTING_KEYS, resolveBotInheritedSettings } from '../../shared/bot-inherited-settings';
import { db } from '../database/db';
import { resolveRuntimeModeSettings, RuntimeModeValidationError, validateRuntimeMode } from './runtimeModePolicy';
import { resolveWebhookBaseUrl } from './webhookBaseUrl';

/**
 * Проверяет все указанные токены и переводит их на наследование одной транзакцией.
 * @param projectId - Идентификатор проекта.
 * @param tokenIds - Идентификаторы токенов без повторов.
 * @param setting - По умолчанию меняет транспорт; all возвращает наследование всех полей.
 * @returns Токены, у которых изменился источник настройки, либо null при несовпадении проекта.
 */
export async function adoptProjectLaunchMode(projectId: number, tokenIds: number[], setting?: 'all'): Promise<number[] | null> {
  return db.transaction(async (tx) => {
    const [project] = await tx.select({
      launchMode: botProjects.defaultLaunchMode, sleepMode: botProjects.defaultSleepMode,
      botSettingDefaults: botProjects.botSettingDefaults,
    })
      .from(botProjects).where(eq(botProjects.id, projectId)).for('update');
    if (!project) return null;

    const tokenMatch = and(eq(botTokens.projectId, projectId), inArray(botTokens.id, tokenIds));
    const tokens = await tx.select({
      id: botTokens.id, inheritLaunchMode: botTokens.inheritLaunchMode, webhookBaseUrl: botTokens.webhookBaseUrl,
      inheritSleepMode: botTokens.inheritSleepMode,
      inheritAutoRestart: botTokens.inheritAutoRestart, inheritMaxRestartAttempts: botTokens.inheritMaxRestartAttempts,
      inheritBotSettings: botTokens.inheritBotSettings,
    })
      .from(botTokens).where(tokenMatch).orderBy(botTokens.id).for('update');
    if (tokens.length !== tokenIds.length) return null;

    const all = setting === 'all';
    const changing = tokens.filter((token) => !token.inheritLaunchMode ||
      (all && (!token.inheritSleepMode || !token.inheritAutoRestart || !token.inheritMaxRestartAttempts ||
        BOT_INHERITED_SETTING_KEYS.some((key) => !token.inheritBotSettings?.includes(key)))));
    const changingIds = changing.map((token) => token.id);
    if (!changingIds.length) return [];
    /** В режиме all прежние настройки обработчика не участвуют в проверке. */
    const variables = all ? [] : await tx.select({
      tokenId: botEnvVariables.tokenId, key: botEnvVariables.key, value: botEnvVariables.value,
    }).from(botEnvVariables).where(and(inArray(botEnvVariables.tokenId, changingIds),
      eq(botEnvVariables.key, 'BOT_POLLING_MODE'))).orderBy(botEnvVariables.id);

    const modes = new Map(variables.map((variable) => [variable.tokenId, variable]));
    /** Проверяет итоговый запуск каждого изменяемого бота до первой записи. */
    for (const token of changing) {
      const sources = all ? BOT_INHERITED_SETTING_KEYS : token.inheritBotSettings;
      const { webhookBaseUrl } = resolveBotInheritedSettings(project.botSettingDefaults, { ...token, inheritBotSettings: sources });
      if (project.launchMode === 'webhook' && !resolveWebhookBaseUrl(webhookBaseUrl)) {
        throw new RuntimeModeValidationError(`Для webhook у бота #${token.id} укажите публичный адрес`);
      }
      const own = modes.get(token.id);
      try {
        const settings = resolveRuntimeModeSettings(
          own ? [own] : [], project.launchMode, process.env, token.id, project.sleepMode, all || token.inheritSleepMode,
        );
        validateRuntimeMode(settings.mode, project.launchMode);
      } catch (error) {
        if (!(error instanceof RuntimeModeValidationError)) throw error;
        throw new RuntimeModeValidationError(`Бот №${token.id}: ${error.message}`);
      }
    }
    const resetSleepIds = all ? changing.filter((token) => !token.inheritSleepMode).map(({ id }) => id) : [];
    if (resetSleepIds.length) {
      await tx.delete(botEnvVariables).where(and(inArray(botEnvVariables.tokenId, resetSleepIds),
        eq(botEnvVariables.key, 'BOT_POLLING_MODE')));
    }
    await tx.update(botTokens).set({
      inheritLaunchMode: true,
      ...(all ? {
        inheritSleepMode: true, inheritAutoRestart: true, inheritMaxRestartAttempts: true,
        inheritBotSettings: [...BOT_INHERITED_SETTING_KEYS],
      } : {}),
    }).where(and(eq(botTokens.projectId, projectId), inArray(botTokens.id, changingIds)));
    return changingIds;
  });
}
