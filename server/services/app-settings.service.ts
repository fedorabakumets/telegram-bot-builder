/**
 * @fileoverview Сервис для работы с настройками приложения
 *
 * Реализует чтение и запись настроек из таблицы `app_settings` в PostgreSQL.
 * Поддерживает in-memory кэш с TTL и fallback на process.env для обратной совместимости.
 *
 * @module server/services/app-settings.service
 */

import { db } from "../database/db";
import { appSettings } from "@shared/schema";
import { eq } from "drizzle-orm";
import { fetchBotUsernameFromToken } from "./telegram-bot-username";

/** In-memory кэш настроек с TTL */
const cache = new Map<string, { value: string; expiresAt: number }>();

/** Время жизни записи в кэше — 60 секунд */
const CACHE_TTL_MS = 60_000;

/** Ключи Telegram Login / Mini App в app_settings */
const TELEGRAM_KEYS = {
  clientId: "telegram_client_id",
  clientSecret: "telegram_client_secret",
  botUsername: "telegram_bot_username",
  botToken: "telegram_bot_token",
} as const;

/**
 * Маппинг ключей настроек на переменные окружения (fallback для старых деплоев)
 */
const ENV_FALLBACK: Record<string, string | undefined> = {
  telegram_client_id:
    process.env.TELEGRAM_CLIENT_ID ?? process.env.VITE_TELEGRAM_CLIENT_ID,
  telegram_client_secret: process.env.TELEGRAM_CLIENT_SECRET,
  telegram_bot_username:
    process.env.VITE_TELEGRAM_BOT_USERNAME ?? process.env.TELEGRAM_BOT_USERNAME,
  telegram_bot_token:
    process.env.TELEGRAM_BOT_TOKEN ?? process.env.VITE_TELEGRAM_BOT_TOKEN,
};

/**
 * Читает настройку только из кэша и БД, без fallback на process.env.
 * Используется при seed для проверки наличия значения именно в БД.
 *
 * @param key - Ключ настройки
 * @returns Значение из БД или undefined если запись отсутствует
 */
async function getSettingFromDb(key: string): Promise<string | undefined> {
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const rows = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, key))
    .limit(1);

  if (rows.length > 0) {
    const value = rows[0].value;
    cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
    return value;
  }
  return undefined;
}

/**
 * Получить значение настройки по ключу.
 *
 * Порядок поиска: кэш → БД → process.env (fallback).
 * Значения из process.env не кэшируются.
 *
 * @param key - Ключ настройки
 * @returns Значение настройки или undefined если не найдено
 */
export async function getSetting(key: string): Promise<string | undefined> {
  // 1. Проверяем кэш
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  // 2. Запрашиваем из БД
  const rows = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, key))
    .limit(1);

  if (rows.length > 0) {
    const value = rows[0].value;
    cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
    return value;
  }

  // 3. Fallback на process.env (не кэшируем)
  return ENV_FALLBACK[key];
}

/**
 * Сохранить или обновить настройку в БД.
 *
 * Выполняет upsert: вставляет новую запись или обновляет существующую.
 * После записи сбрасывает кэш для данного ключа.
 *
 * @param key - Ключ настройки
 * @param value - Значение настройки
 */
export async function setSetting(key: string, value: string): Promise<void> {
  await db
    .insert(appSettings)
    .values({ key, value })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value, updatedAt: new Date() },
    });

  // Сбрасываем кэш — следующий getSetting перечитает из БД
  cache.delete(key);
}

/**
 * Получить все настройки из БД одним запросом.
 *
 * @returns Объект вида `{ ключ: значение }`
 */
export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await db.select().from(appSettings);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

/**
 * Проверяет, задан ли непустой ключ настройки.
 * @param value - Значение из getSetting
 * @returns true если строка непустая
 */
function isNonEmptySetting(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Резолвит username бота: из БД или через getMe по токену.
 * @returns Username без @ или undefined
 */
export async function resolveBotUsername(): Promise<string | undefined> {
  const storedUsername = await getSetting(TELEGRAM_KEYS.botUsername);
  if (isNonEmptySetting(storedUsername)) {
    return storedUsername!.replace(/^@/, "");
  }

  const token = await getSetting(TELEGRAM_KEYS.botToken);
  if (!isNonEmptySetting(token)) return undefined;

  return fetchBotUsernameFromToken(token!);
}

/**
 * Проверяет, настроен ли провайдер Telegram Login.
 * Требует client_id, client_secret и username (явный или из bot token).
 * @returns true если Telegram auth готов к использованию
 */
export async function isTelegramAuthConfigured(): Promise<boolean> {
  const [clientId, clientSecret, username] = await Promise.all([
    getSetting(TELEGRAM_KEYS.clientId),
    getSetting(TELEGRAM_KEYS.clientSecret),
    resolveBotUsername(),
  ]);

  return (
    isNonEmptySetting(clientId) &&
    isNonEmptySetting(clientSecret) &&
    isNonEmptySetting(username)
  );
}

/**
 * Проверить, завершена ли платформенная настройка (агрегатор провайдеров).
 *
 * Сейчас: только Telegram. При добавлении email/OAuth — расширить агрегатор.
 *
 * В режиме разработки (`NODE_ENV=development`) или при `SKIP_AUTH=true`
 * всегда возвращает `true`, если не задан `SETUP_WIZARD_STRICT=true`.
 *
 * @returns `true` если хотя бы один провайдер настроен (или dev bypass)
 */
export async function isConfigured(): Promise<boolean> {
  if (isPlatformAuthBypassed()) {
    return true;
  }

  return await isTelegramAuthConfigured();
}

/**
 * Проверяет, включён ли режим dev-login (SKIP_AUTH не равен false).
 * @returns `true` если вход по Telegram ID без proof разрешён
 */
export function isAuthSkipped(): boolean {
  return process.env.SKIP_AUTH !== "false";
}

/**
 * Проверяет, включён ли строгий режим setup wizard (проверка БД даже в dev).
 * @returns true если SETUP_WIZARD_STRICT=true
 */
export function isSetupWizardStrict(): boolean {
  return process.env.SETUP_WIZARD_STRICT === "true";
}

/**
 * Платформа считает setup завершённым без Telegram (dev bypass).
 * @returns true если SKIP_AUTH или dev без SETUP_WIZARD_STRICT
 */
export function isPlatformAuthBypassed(): boolean {
  if (isSetupWizardStrict()) return false;
  return process.env.NODE_ENV === "development" || isAuthSkipped();
}

/**
 * Переносит значения из process.env в таблицу app_settings при первом запуске.
 *
 * Для каждого обязательного ключа: если значение есть в env, но отсутствует в БД —
 * записывает его в БД. Уже существующие записи не перезаписываются.
 * Вызывается один раз при старте сервера после миграций.
 *
 * @returns Promise<void>
 */
export async function seedSettingsFromEnv(): Promise<void> {
  const pairs: Array<[string, string | undefined]> = [
    ["telegram_client_id", process.env.TELEGRAM_CLIENT_ID ?? process.env.VITE_TELEGRAM_CLIENT_ID],
    ["telegram_client_secret", process.env.TELEGRAM_CLIENT_SECRET],
    ["telegram_bot_username", process.env.VITE_TELEGRAM_BOT_USERNAME ?? process.env.TELEGRAM_BOT_USERNAME],
    ["telegram_bot_token", process.env.TELEGRAM_BOT_TOKEN ?? process.env.VITE_TELEGRAM_BOT_TOKEN],
  ];

  for (const [key, value] of pairs) {
    if (!value?.trim()) continue;
    const existing = await getSettingFromDb(key);
    if (!existing) {
      await setSetting(key, value);
      console.log(`[AppSettings] Перенесено из env в БД: ${key}`);
    }
  }
}
