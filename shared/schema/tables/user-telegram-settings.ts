/**
 * @fileoverview Таблица пользовательских настроек для Telegram Client API
 * @module shared/schema/tables/user-telegram-settings
 */

import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

/**
 * Таблица пользовательских настроек для Telegram Client API
 */
export const userTelegramSettings = pgTable("user_telegram_settings", {
  /** Уникальный идентификатор настроек */
  id: serial("id").primaryKey(),
  /** Уникальный ID пользователя (например, email или внутренний ID) */
  userId: text("user_id").notNull().unique(),
  /** Telegram API ID */
  apiId: text("api_id"),
  /** Telegram API Hash */
  apiHash: text("api_hash"),
  /** Номер телефона для авторизации */
  phoneNumber: text("phone_number"),
  /** Сохраненная сессия */
  sessionString: text("session_string"),
  /** Флаг активности (0 = неактивен, 1 = активен) */
  isActive: integer("is_active").default(1),
  /** Дата создания настроек */
  createdAt: timestamp("created_at").defaultNow(),
  /** Дата последнего обновления настроек */
  updatedAt: timestamp("updated_at").defaultNow(),
});

/** Схема для вставки данных пользовательских настроек Telegram API */
export const insertUserTelegramSettingsSchema = z.object({
  /** Идентификатор пользователя (обязательное поле) */
  userId: z.string().min(1, "ID пользователя обязателен"),
  /** Telegram API ID (обязательное поле) */
  apiId: z.string().min(1, "API ID обязателен"),
  /** Telegram API Hash (обязательное поле) */
  apiHash: z.string().min(1, "API Hash обязателен"),
  /** Номер телефона для авторизации */
  phoneNumber: z.string().nullable().optional(),
  /** Сохраненная сессия */
  sessionString: z.string().nullable().optional(),
  /** Флаг активности (0 = неактивен, 1 = активен) */
  isActive: z.number().min(0).max(1).default(1),
});

/** Тип записи настроек Telegram */
export type UserTelegramSettings = typeof userTelegramSettings.$inferSelect;

/** Тип для вставки настроек Telegram */
export type InsertUserTelegramSettings = Omit<typeof userTelegramSettings.$inferInsert, "id" | "createdAt" | "updatedAt">;
