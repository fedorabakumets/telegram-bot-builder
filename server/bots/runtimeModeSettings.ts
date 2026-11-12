/** @fileoverview Чтение и атомарное сохранение режима в переменных конкретного бота. */

import { and, eq } from 'drizzle-orm';
import { botEnvVariables, botTokens } from '@shared/schema';
import { db } from '../database/db';
import { parseRuntimeMode, resolveRuntimeModeSettings, validateRuntimeMode } from './runtimeModePolicy';

/** Изменения транспортных настроек и режима, проверяемые одной транзакцией. */
export interface RuntimeModeChanges {
  /** Новое индивидуальное значение режима. */
  mode?: unknown;
  /** Удаление индивидуальной настройки с наследованием серверной. */
  resetMode?: boolean;
  /** Способ получения новых сообщений. */
  launchMode?: 'polling' | 'webhook';
  /** Базовый адрес вебхука. */
  webhookBaseUrl?: string | null;
  /** Секрет проверки входящих запросов вебхука. */
  webhookSecretToken?: string | null;
}

/** Читает только безопасные поля настройки, проверяя привязку токена к проекту. */
export async function getRuntimeModeSettings(tokenId: number, projectId?: number) {
  const [token] = await db.select({ projectId: botTokens.projectId, launchMode: botTokens.launchMode })
    .from(botTokens).where(eq(botTokens.id, tokenId));
  if (!token || (projectId !== undefined && token.projectId !== projectId)) return null;
  const variables = await db.select({ key: botEnvVariables.key, value: botEnvVariables.value })
    .from(botEnvVariables).where(and(eq(botEnvVariables.tokenId, tokenId), eq(botEnvVariables.key, 'BOT_POLLING_MODE')))
    .orderBy(botEnvVariables.id);
  return resolveRuntimeModeSettings(variables, token.launchMode, process.env, tokenId);
}

/** Сохраняет единственное значение режима под блокировкой токена без перезапуска бота. */
export async function saveRuntimeMode(tokenId: number, value: unknown, projectId?: number) {
  const mode = parseRuntimeMode(value);
  return saveRuntimeModeSettings(tokenId, { mode }, projectId);
}

/** Атомарно проверяет итоговую комбинацию транспорта и режима под общей блокировкой токена. */
export async function saveRuntimeModeSettings(tokenId: number, changes: RuntimeModeChanges, projectId?: number) {
  return db.transaction(async (tx) => {
    const [token] = await tx.select({ projectId: botTokens.projectId, launchMode: botTokens.launchMode })
      .from(botTokens).where(eq(botTokens.id, tokenId)).for('update');
    if (!token || (projectId !== undefined && token.projectId !== projectId)) return null;
    const match = and(eq(botEnvVariables.tokenId, tokenId), eq(botEnvVariables.key, 'BOT_POLLING_MODE'));
    const existing = await tx.select({ key: botEnvVariables.key, value: botEnvVariables.value })
      .from(botEnvVariables).where(match).orderBy(botEnvVariables.id);
    const hasMode = Object.prototype.hasOwnProperty.call(changes, 'mode');
    const variables = changes.resetMode ? [] : hasMode
      ? [{ key: 'BOT_POLLING_MODE', value: parseRuntimeMode(changes.mode) }] : existing;
    const launchMode = changes.launchMode ?? token.launchMode ?? 'polling';
    const settings = resolveRuntimeModeSettings(variables, launchMode, process.env, tokenId);
    validateRuntimeMode(settings.mode, launchMode);
    if (hasMode || changes.resetMode) {
      await tx.delete(botEnvVariables).where(match);
      if (!changes.resetMode) await tx.insert(botEnvVariables).values({
        tokenId, key: 'BOT_POLLING_MODE', value: settings.mode, isSecret: 0,
      });
    }
    if (changes.launchMode !== undefined) {
      const { mode: ignoredMode, resetMode: ignoredReset, ...transport } = changes;
      await tx.update(botTokens).set(transport).where(eq(botTokens.id, tokenId));
    }
    return settings;
  });
}
