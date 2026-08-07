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

/** Ключ режима входа в app_settings */
export const AUTH_LOGIN_MODE_KEY = "auth_login_mode";

/** Режим входа: dev-login по ID или Telegram Login Widget */
export type AuthLoginMode = "dev_login" | "telegram_widget";

/** Допустимые значения auth_login_mode */
export const AUTH_LOGIN_MODES: AuthLoginMode[] = ["dev_login", "telegram_widget"];

/** Синхронный кэш skipAuth (обновляется из БД при старте и после setSetting) */
let skipAuthSyncCache: boolean | null = null;

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

  cache.delete(key);

  if (key === AUTH_LOGIN_MODE_KEY) {
    skipAuthSyncCache = value === "dev_login";
  }
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
 * Резолвит dev-login из строки режима или env fallback.
 * @param mode - Значение из БД
 * @returns true если dev-login
 */
function resolveSkipAuthFromMode(mode: string | undefined): boolean {
  if (mode === "dev_login") return true;
  if (mode === "telegram_widget") return false;
  return process.env.SKIP_AUTH !== "false";
}

/**
 * Обновляет синхронный кэш skipAuth из БД (вызывать при старте сервера).
 * @returns Promise<void>
 */
export async function refreshAuthLoginCache(): Promise<void> {
  const mode = await getSettingFromDb(AUTH_LOGIN_MODE_KEY);
  skipAuthSyncCache = resolveSkipAuthFromMode(mode);
}

/**
 * Текущий режим входа для admin UI и API.
 * @returns dev_login или telegram_widget
 */
export async function getAuthLoginMode(): Promise<AuthLoginMode> {
  const mode = await getSetting(AUTH_LOGIN_MODE_KEY);
  if (mode === "telegram_widget") return "telegram_widget";
  if (mode === "dev_login") return "dev_login";
  return process.env.SKIP_AUTH === "false" ? "telegram_widget" : "dev_login";
}

/**
 * Синхронно: dev-login активен (кэш или env).
 * @returns true если вход по Telegram ID без виджета
 */
export function isAuthSkippedSync(): boolean {
  if (skipAuthSyncCache !== null) return skipAuthSyncCache;
  return process.env.SKIP_AUTH !== "false";
}

/**
 * Проверить, завершена ли платформенная настройка (агрегатор провайдеров).
 *
 * При режиме dev-login в admin — Telegram credentials не требуются.
 *
 * @returns `true` если вход настроен (dev-login или Telegram)
 */
export async function isConfigured(): Promise<boolean> {
  if (isAuthSkippedSync()) {
    return true;
  }

  return await isTelegramAuthConfigured();
}

/**
 * Проверяет, включён ли режим dev-login.
 * @returns `true` если вход по Telegram ID без виджета
 */
export function isAuthSkipped(): boolean {
  return isAuthSkippedSync();
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
  const authMode =
    process.env.SKIP_AUTH === "false" ? "telegram_widget" : "dev_login";

  const pairs: Array<[string, string | undefined]> = [
    [AUTH_LOGIN_MODE_KEY, authMode],
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

  await refreshAuthLoginCache();
}
