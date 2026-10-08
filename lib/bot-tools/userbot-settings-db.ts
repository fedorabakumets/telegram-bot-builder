/**
 * @fileoverview Настройка режима Telethon Userbot через API конструктора.
 * @module lib/bot-tools/userbot-settings-db
 */
import type { ReadDbOptions } from './node-query-db.ts';
import { requestUserbotInDb } from './userbot-request-db.ts';

/** Изменения настроек аккаунта */
export interface UserbotSettings {
  /** Включение режима */
  enabled: 0 | 1;
  /** API ID; null очищает сохранённое значение */
  api_id?: string | null;
  /** API Hash; пустое значение или маска сохраняют прежний секрет */
  api_hash?: string | null;
  /** Сессия; пустое значение или маска сохраняют прежний секрет */
  session_string?: string | null;
}

/**
 * Сохраняет только переданные настройки без автоматического перезапуска.
 * @param projectId - Идентификатор проекта
 * @param tokenId - Идентификатор токена
 * @param settings - Изменяемые настройки
 * @param options - Параметры API
 * @returns Безопасный статус сохранения
 */
export function setUserbotSettingsInDb(
  projectId: number, tokenId: number, settings: UserbotSettings, options?: ReadDbOptions,
) {
  const body: Record<string, unknown> = { userbotEnabled: settings.enabled };
  if (settings.api_id !== undefined) body.userbotApiId = settings.api_id;
  if (settings.api_hash !== undefined) body.userbotApiHash = settings.api_hash;
  if (settings.session_string !== undefined) body.userbotSessionString = settings.session_string;
  return requestUserbotInDb(projectId, tokenId, '', body, options);
}
