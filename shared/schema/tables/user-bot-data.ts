/**
 * @fileoverview Таблица user database проекта и схема вставки с поддержкой tokenId
 * @module shared/schema/tables/user-bot-data
 */

import { pgTable, text, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

import { botProjects } from "./bot-projects";

/**
 * Таблица пользовательских данных бота
 */
export const userBotData = pgTable("user_bot_data", {
  /** Уникальный идентификатор записи */
  id: serial("id").primaryKey(),
  /** Идентификатор проекта */
  projectId: integer("project_id").references(() => botProjects.id, { onDelete: "cascade" }).notNull(),
  /** Идентификатор токена бота для сегментации базы */
  tokenId: integer("token_id").notNull().default(0),
  /** Идентификатор пользователя в Telegram */
  userId: text("user_id").notNull(),
  /** Имя пользователя в Telegram */
  userName: text("user_name"),
  /** Имя пользователя */
  firstName: text("first_name"),
  /** Фамилия пользователя */
  lastName: text("last_name"),
  /** Код языка пользователя */
  languageCode: text("language_code"),
  /** Флаг бота: 0 - человек, 1 - бот */
  isBot: integer("is_bot").default(0),
  /** Флаг premium */
  isPremium: integer("is_premium").default(0),
  /** Время последнего взаимодействия */
  lastInteraction: timestamp("last_interaction").defaultNow(),
  /** Количество взаимодействий */
  interactionCount: integer("interaction_count").default(0),
  /** Пользовательские данные */
  userData: jsonb("user_data").default({}),
  /** Текущее состояние */
  currentState: text("current_state"),
  /** Настройки пользователя */
  preferences: jsonb("preferences").default({}),
  /** Статистика использования команд */
  commandsUsed: jsonb("commands_used").default({}),
  /** Количество сессий */
  sessionsCount: integer("sessions_count").default(1),
  /** Всего отправлено сообщений */
  totalMessagesSent: integer("total_messages_sent").default(0),
  /** Всего получено сообщений */
  totalMessagesReceived: integer("total_messages_received").default(0),
  /** Информация об устройстве */
  deviceInfo: text("device_info"),
  /** Данные геолокации */
  locationData: jsonb("location_data"),
  /** Контактные данные */
  contactData: jsonb("contact_data"),
  /** Флаг блокировки */
  isBlocked: integer("is_blocked").default(0),
  /** Флаг активности */
  isActive: integer("is_active").default(1),
  /** Теги пользователя */
  tags: text("tags").array().default([]),
  /** Заметки администратора */
  notes: text("notes"),
  /** URL аватарки пользователя */
  avatarUrl: text("avatar_url"),
  /** Дата создания записи */
  createdAt: timestamp("created_at").defaultNow(),
  /** Дата последнего обновления записи */
  updatedAt: timestamp("updated_at").defaultNow(),
});

/** Схема вставки пользовательских данных бота */
export const insertUserBotDataSchema = z.object({
  /** Идентификатор проекта */
  projectId: z.number().int(),
  /** Идентификатор токена бота */
  tokenId: z.number().int().min(0).default(0),
  /** Идентификатор пользователя в Telegram */
  userId: z.string().min(1, "ID пользователя обязателен"),
  /** Имя пользователя в Telegram */
  userName: z.string().nullable().optional(),
  /** Имя пользователя */
  firstName: z.string().nullable().optional(),
  /** Фамилия пользователя */
  lastName: z.string().nullable().optional(),
  /** Код языка пользователя */
  languageCode: z.string().nullable().optional(),
  /** Флаг бота */
  isBot: z.number().min(0).max(1).default(0),
  /** Флаг premium */
  isPremium: z.number().min(0).max(1).default(0),
  /** Время последнего взаимодействия */
  lastInteraction: z.date().optional(),
  /** Количество взаимодействий */
  interactionCount: z.number().min(0).default(0),
  /** Пользовательские данные */
  userData: z.record(z.any()).default({}),
  /** Текущее состояние */
  currentState: z.string().nullable().optional(),
  /** Настройки пользователя */
  preferences: z.record(z.any()).default({}),
  /** Статистика команд */
  commandsUsed: z.record(z.any()).default({}),
  /** Количество сессий */
  sessionsCount: z.number().min(1).default(1),
  /** Всего отправлено сообщений */
  totalMessagesSent: z.number().min(0).default(0),
  /** Всего получено сообщений */
  totalMessagesReceived: z.number().min(0).default(0),
  /** Информация об устройстве */
  deviceInfo: z.string().nullable().optional(),
  /** Данные геолокации */
  locationData: z.record(z.any()).nullable().optional(),
  /** Контактные данные */
  contactData: z.record(z.any()).nullable().optional(),
  /** Флаг блокировки */
  isBlocked: z.number().min(0).max(1).default(0),
  /** Флаг активности */
  isActive: z.number().min(0).max(1).default(1),
  /** Теги пользователя */
  tags: z.array(z.string()).default([]),
  /** Заметки администратора */
  notes: z.string().nullable().optional(),
});

/** Тип записи пользовательских данных бота */
export type UserBotData = typeof userBotData.$inferSelect;

/** Тип для вставки пользовательских данных бота */
export type InsertUserBotData = z.infer<typeof insertUserBotDataSchema>;
