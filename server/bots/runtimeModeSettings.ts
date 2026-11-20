/** @fileoverview Чтение и атомарное сохранение режима в переменных конкретного бота. */

import { resolveWebhookSecret } from './webhookSecretValue';
import { and, eq } from 'drizzle-orm';
import { botEnvVariables, botProjects, botTokens } from '@shared/schema';
import { resolveBotLaunchMode, type BotLaunchMode } from '../../shared/bot-launch-mode';
import { resolveBotInheritedSettings } from '../../shared/bot-inherited-settings';
import { db } from '../database/db';
import { parseRuntimeMode, resolveRuntimeModeSettings, RuntimeModeValidationError, validateRuntimeMode } from './runtimeModePolicy';
import { resolveWebhookBaseUrl } from './webhookBaseUrl';
import type { BotAutoRestartPatch } from './botAutoRestartPatch';
import { buildBotInheritedSettingsPatch, type BotInheritedSettingChanges } from './botInheritedSettingsPatch';

/** Изменения транспортных настроек и режима, проверяемые одной транзакцией. */
export interface RuntimeModeChanges {
  /** Новое индивидуальное значение режима. */
  mode?: unknown;
  /** Удаление индивидуальной настройки с наследованием проектной. */
  resetMode?: boolean;
  /** Индивидуальный способ получения сообщений или возврат к настройке проекта. */
  launchMode?: BotLaunchMode | 'inherit';
  /** Явное значение адреса вебхука или возврат к адресу проекта. */
  webhookBaseUrl?: string | null;
  /** Секрет проверки входящих запросов вебхука. */
  webhookSecretToken?: string | null;
  /** Проверенные поля автоперезапуска из пакета. */
  autoRestartPatch?: BotAutoRestartPatch;
  /** Изменения отдельных источников для настроек поведения и данных. */
  botSettingChanges?: BotInheritedSettingChanges;
}

/** Читает только безопасные поля настройки, проверяя привязку токена к проекту. */
export async function getRuntimeModeSettings(tokenId: number, projectId?: number) {
  const [token] = await db.select({
    projectId: botTokens.projectId, launchMode: botTokens.launchMode,
    inheritLaunchMode: botTokens.inheritLaunchMode, defaultLaunchMode: botProjects.defaultLaunchMode,
    inheritSleepMode: botTokens.inheritSleepMode, defaultSleepMode: botProjects.defaultSleepMode,
  }).from(botTokens).innerJoin(botProjects, eq(botTokens.projectId, botProjects.id)).where(eq(botTokens.id, tokenId));
  if (!token || (projectId !== undefined && token.projectId !== projectId)) return null;
  const variables = await db.select({ key: botEnvVariables.key, value: botEnvVariables.value })
    .from(botEnvVariables).where(and(eq(botEnvVariables.tokenId, tokenId), eq(botEnvVariables.key, 'BOT_POLLING_MODE')))
    .orderBy(botEnvVariables.id);
  const launchMode = resolveBotLaunchMode(token.defaultLaunchMode, token.launchMode, token.inheritLaunchMode);
  return { ...resolveRuntimeModeSettings(variables, launchMode, process.env, tokenId, token.defaultSleepMode, token.inheritSleepMode),
    inheritLaunchMode: token.inheritLaunchMode, inheritSleepMode: token.inheritSleepMode, projectSleepMode: token.defaultSleepMode };
}

/** Сохраняет единственное значение режима под блокировкой токена без перезапуска бота. */
export async function saveRuntimeMode(tokenId: number, value: unknown, projectId?: number) {
  const mode = parseRuntimeMode(value);
  return saveRuntimeModeSettings(tokenId, { mode }, projectId);
}

/** Атомарно проверяет итоговую комбинацию, блокируя сначала проект, затем токен. */
export async function saveRuntimeModeSettings(tokenId: number, changes: RuntimeModeChanges, projectId?: number) {
  return db.transaction(async (tx) => {
    let targetProjectId = projectId;
    if (targetProjectId === undefined) {
      const [owner] = await tx.select({ projectId: botTokens.projectId })
        .from(botTokens).where(eq(botTokens.id, tokenId));
      targetProjectId = owner?.projectId;
    }
    if (targetProjectId === undefined) return null;
    const [project] = await tx.select({
      defaultLaunchMode: botProjects.defaultLaunchMode, defaultSleepMode: botProjects.defaultSleepMode,
      botSettingDefaults: botProjects.botSettingDefaults,
    })
      .from(botProjects).where(eq(botProjects.id, targetProjectId)).for('update');
    if (!project) return null;
    const [token] = await tx.select().from(botTokens)
      .where(and(eq(botTokens.id, tokenId), eq(botTokens.projectId, targetProjectId))).for('update');
    if (!token) return null;
    const match = and(eq(botEnvVariables.tokenId, tokenId), eq(botEnvVariables.key, 'BOT_POLLING_MODE'));
    const existing = await tx.select({ key: botEnvVariables.key, value: botEnvVariables.value })
      .from(botEnvVariables).where(match).orderBy(botEnvVariables.id);
    const hasMode = Object.prototype.hasOwnProperty.call(changes, 'mode');
    const resetMode = changes.resetMode === true;
    const inheritSleepMode = resetMode ? true : hasMode ? false : token.inheritSleepMode;
    const variables = resetMode ? [] : hasMode
      ? [{ key: 'BOT_POLLING_MODE', value: parseRuntimeMode(changes.mode) }] : existing;
    const inheritLaunchMode = changes.launchMode === undefined ? token.inheritLaunchMode : changes.launchMode === 'inherit';
    const ownLaunchMode = changes.launchMode === 'inherit' ? token.launchMode : changes.launchMode ?? token.launchMode;
    const launchMode = resolveBotLaunchMode(project.defaultLaunchMode, ownLaunchMode, inheritLaunchMode);
    const settings = resolveRuntimeModeSettings(variables, launchMode, process.env, tokenId, project.defaultSleepMode, inheritSleepMode);
    if (hasMode || resetMode || changes.launchMode !== undefined) validateRuntimeMode(settings.mode, launchMode);
    const botSettingChanges = { ...changes.botSettingChanges,
      ...(changes.webhookBaseUrl === undefined ? {} : { webhookBaseUrl: changes.webhookBaseUrl }) };
    const inheritedPatch = Object.keys(botSettingChanges).length
      ? buildBotInheritedSettingsPatch(token.inheritBotSettings, botSettingChanges) : {};
    const effective = resolveBotInheritedSettings(project.botSettingDefaults, { ...token, ...inheritedPatch });
    /** Проверяет адрес после смены транспорта или источника самого адреса. */
    if ((changes.launchMode !== undefined || botSettingChanges.webhookBaseUrl !== undefined)
      && launchMode === 'webhook' && !resolveWebhookBaseUrl(effective.webhookBaseUrl)) {
      throw new RuntimeModeValidationError('Для webhook укажите публичный адрес');
    }
    if (hasMode || resetMode) {
      await tx.delete(botEnvVariables).where(match);
      if (!resetMode) await tx.insert(botEnvVariables).values({
        tokenId, key: 'BOT_POLLING_MODE', value: settings.mode, isSecret: 0,
      });
    }
    /** Сохраняет независимые источники в той же транзакции, если они есть в пакете. */
    const patch: Partial<typeof botTokens.$inferInsert> = { ...changes.autoRestartPatch, ...inheritedPatch };
    if (hasMode || resetMode) patch.inheritSleepMode = inheritSleepMode;
    if (changes.launchMode !== undefined) {
      patch.launchMode = ownLaunchMode;
      patch.inheritLaunchMode = inheritLaunchMode;
    }
    if (changes.launchMode !== undefined || changes.webhookSecretToken !== undefined) {
      /** При включении вебхука пустое поле автоматически заменяется защищённым секретом. */
      patch.webhookSecretToken = launchMode === 'webhook' ? resolveWebhookSecret(
        changes.webhookSecretToken?.trim() ? changes.webhookSecretToken : token.webhookSecretToken) : changes.webhookSecretToken;
    }
    if (Object.keys(patch).length) await tx.update(botTokens).set(patch).where(eq(botTokens.id, tokenId));
    return { ...settings, inheritLaunchMode, inheritSleepMode, projectSleepMode: project.defaultSleepMode,
      botSettings: effective, inheritBotSettings: patch.inheritBotSettings ?? token.inheritBotSettings };
  });
}
