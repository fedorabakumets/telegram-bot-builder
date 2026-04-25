/**
 * @fileoverview Таблица настроек приложения (ключ-значение)
 * @module shared/schema/tables/app-settings
 */

import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Таблица настроек приложения в формате ключ-значение.
 * Используется для хранения глобальных параметров конфигурации,
 * например флага завершения мастера первоначальной настройки.
 */
export const appSettings = pgTable("app_settings", {
  /** Уникальный ключ настройки */
  key: text("key").primaryKey(),
  /** Значение настройки */
  value: text("value").notNull(),
  /** Дата последнего обновления */
  updatedAt: timestamp("updated_at").defaultNow(),
});

/** Тип записи настройки приложения */
export type AppSetting = typeof appSettings.$inferSelect;

/** Тип для вставки настройки приложения */
export type InsertAppSetting = typeof appSettings.$inferInsert;
