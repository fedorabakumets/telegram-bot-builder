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

/** In-memory кэш настроек с TTL */
const cache = new Map<string, { value: string; expiresAt: number }>();

/** Время жизни записи в кэше — 60 секунд */
const CACHE_TTL_MS = 60_000;

/**
 * Обязательные ключи для проверки завершённости настройки приложения
 */
const REQUIRED_KEYS = [
  "telegram_client_id",
  "telegram_client_secret",
  "telegram_bot_username",
] as const;

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
 * Проверить, настроены ли все обязательные ключи приложения.
 *
 * В режиме разработки (`NODE_ENV=development`) всегда возвращает `true`,
 * чтобы не блокировать запуск при отсутствии настроек в БД.
 *
 * В production считает приложение настроенным, если все три ключа
 * присутствуют и непустые: `telegram_client_id`, `telegram_client_secret`,
 * `telegram_bot_username`.
 *
 * @returns `true` если все обязательные ключи заданы (или режим разработки)
 */
export async function isConfigured(): Promise<boolean> {
  // В dev-режиме считаем настроенным даже без данных в БД
  if (process.env.NODE_ENV === "development") {
    return true;
  }
  const values = await Promise.all(REQUIRED_KEYS.map(getSetting));
  return values.every((v) => typeof v === "string" && v.trim().length > 0);
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
