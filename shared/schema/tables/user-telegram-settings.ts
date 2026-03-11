/**
 * @fileoverview Таблица пользовательских настроек для Telegram Client API
 * @module shared/schema/tables/user-telegram-settings
 */

import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
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
export const insertUserTelegramSettingsSchema = createInsertSchema(userTelegramSettings).pick({
  /** Уникальный ID пользователя */
  userId: true,
  /** Telegram API ID */
  apiId: true,
  /** Telegram API Hash */
  apiHash: true,
  /** Номер телефона для авторизации */
  phoneNumber: true,
  /** Сохраненная сессия */
  sessionString: true,
  /** Флаг активности (0 = неактивен, 1 = активен) */
  isActive: true,
}).extend({
  /** Идентификатор пользователя (обязательное поле) */
  userId: z.string().min(1, "ID пользователя обязателен"),
  /** Telegram API ID (обязательное поле) */
  apiId: z.string().min(1, "API ID обязателен"),
  /** Telegram API Hash (обязательное поле) */
  apiHash: z.string().min(1, "API Hash обязателен"),
  /** Номер телефона для авторизации */
  phoneNumber: z.string().optional(),
  /** Флаг активности (0 = неактивен, 1 = активен) */
  isActive: z.number().min(0).max(1).default(1),
});

/** Тип записи настроек Telegram */
export type UserTelegramSettings = typeof userTelegramSettings.$inferSelect;

/** Тип для вставки настроек Telegram */
export type InsertUserTelegramSettings = z.infer<typeof insertUserTelegramSettingsSchema>;
