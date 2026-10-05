/**
 * @fileoverview Загрузка оверлея рантайма из app_settings и прокси Telegram
 * @module server/admin/runtime-overlay-refresh
 */

import { like } from "drizzle-orm";
import { appSettings } from "@shared/schema";
import { db } from "../database/db";
import { runtimeEnv, setRuntimeOverlay } from "../services/runtime-overlay";
import { RUNTIME_SETTING_PREFIX } from "./runtime-field";

/**
 * Читает ключи `runtime.*` из базы и заменяет оверлей.
 * Пустые строки не попадают в оверлей: снова читается живой process.env.
 * @returns Promise<void>
 */
export async function refreshRuntimeOverlay(): Promise<void> {
  const rows = await db.select().from(appSettings).where(like(appSettings.key, `${RUNTIME_SETTING_PREFIX}%`));
  const values: Record<string, string> = {};
  for (const row of rows) {
    if (!row.key.startsWith(RUNTIME_SETTING_PREFIX)) continue;
    const name = row.key.slice(RUNTIME_SETTING_PREFIX.length);
    if (name && row.value.trim()) values[name] = row.value;
  }
  setRuntimeOverlay(values);
}

/**
 * Если прокси Telegram задан админкой или env, проставляет HTTP(S)_PROXY.
 * Сам TELEGRAM_PROXY_URL в process.env не копируется.
 * @returns void
 */
export function applyRuntimeProxyEnv(): void {
  const proxy = runtimeEnv("TELEGRAM_PROXY_URL");
  if (!proxy) return;
  process.env.HTTP_PROXY = proxy;
  process.env.HTTPS_PROXY = proxy;
}
