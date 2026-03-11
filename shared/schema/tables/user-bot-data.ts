/**
 * @fileoverview Таблица пользовательских данных бота
 * @module shared/schema/tables/user-bot-data
 */

import { pgTable, text, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { botProjects } from "./bot-projects";

/**
 * Таблица пользовательских данных бота
 */
export const userBotData = pgTable("user_bot_data", {
  /** Уникальный идентификатор записи */
  id: serial("id").primaryKey(),
  /** Идентификатор проекта (ссылка на bot_projects.id) */
  projectId: integer("project_id").references(() => botProjects.id, { onDelete: "cascade" }).notNull(),
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
  /** Флаг бота (0 = человек, 1 = бот) */
  isBot: integer("is_bot").default(0),
  /** Флаг премиум-статуса (0 = обычный, 1 = премиум) */
  isPremium: integer("is_premium").default(0),
  /** Время последнего взаимодействия */
  lastInteraction: timestamp("last_interaction").defaultNow(),
  /** Количество взаимодействий */
  interactionCount: integer("interaction_count").default(0),
  /** Пользовательские данные (ответы на вопросы, формы и т.д.) */
  userData: jsonb("user_data").default({}),
  /** Текущее состояние в диалоге с ботом */
  currentState: text("current_state"),
  /** Пользовательские настройки */
  preferences: jsonb("preferences").default({}),
  /** Статистика использования команд */
  commandsUsed: jsonb("commands_used").default({}),
  /** Количество сессий */
  sessionsCount: integer("sessions_count").default(1),
  /** Общее количество отправленных сообщений */
  totalMessagesSent: integer("total_messages_sent").default(0),
  /** Общее количество полученных сообщений */
  totalMessagesReceived: integer("total_messages_received").default(0),
  /** Информация об устройстве */
  deviceInfo: text("device_info"),
  /** Данные геолокации (если предоставлены) */
  locationData: jsonb("location_data"),
  /** Контактные данные (если предоставлены) */
  contactData: jsonb("contact_data"),
  /** Флаг блокировки (0 = не заблокирован, 1 = заблокирован) */
  isBlocked: integer("is_blocked").default(0),
  /** Флаг активности (0 = неактивен, 1 = активен) */
  isActive: integer("is_active").default(1),
  /** Теги для категоризации пользователей */
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

/** Схема для вставки данных пользовательских данных бота */
export const insertUserBotDataSchema = createInsertSchema(userBotData).pick({
  /** Идентификатор проекта (ссылка на bot_projects.id) */
  projectId: true,
  /** Идентификатор пользователя в Telegram */
  userId: true,
  /** Имя пользователя в Telegram */
  userName: true,
  /** Имя пользователя */
  firstName: true,
  /** Фамилия пользователя */
  lastName: true,
  /** Код языка пользователя */
  languageCode: true,
  /** Флаг бота (0 = человек, 1 = бот) */
  isBot: true,
  /** Флаг премиум-статуса (0 = обычный, 1 = премиум) */
  isPremium: true,
  /** Время последнего взаимодействия */
  lastInteraction: true,
  /** Количество взаимодействий */
  interactionCount: true,
  /** Пользовательские данные */
  userData: true,
  /** Текущее состояние в диалоге с ботом */
  currentState: true,
  /** Пользовательские настройки */
  preferences: true,
  /** Статистика использования команд */
  commandsUsed: true,
  /** Количество сессий */
  sessionsCount: true,
  /** Общее количество отправленных сообщений */
  totalMessagesSent: true,
  /** Общее количество полученных сообщений */
  totalMessagesReceived: true,
  /** Информация об устройстве */
  deviceInfo: true,
  /** Данные геолокации */
  locationData: true,
  /** Контактные данные */
  contactData: true,
  /** Флаг блокировки */
  isBlocked: true,
  /** Флаг активности */
  isActive: true,
  /** Теги для категоризации пользователей */
  tags: true,
  /** Заметки администратора */
  notes: true,
}).extend({
  /** Идентификатор пользователя (обязательное поле) */
  userId: z.string().min(1, "ID пользователя обязателен"),
  /** Пользовательские данные */
  userData: z.record(z.any()).default({}),
  /** Пользовательские настройки */
  preferences: z.record(z.any()).default({}),
  /** Статистика использования команд */
  commandsUsed: z.record(z.any()).default({}),
  /** Теги пользователя */
  tags: z.array(z.string()).default([]),
  /** Флаг бота (0 = человек, 1 = бот) */
  isBot: z.number().min(0).max(1).default(0),
  /** Флаг премиум-статуса (0 = обычный, 1 = премиум) */
  isPremium: z.number().min(0).max(1).default(0),
  /** Флаг блокировки (0 = не заблокирован, 1 = заблокирован) */
  isBlocked: z.number().min(0).max(1).default(0),
  /** Флаг активности (0 = неактивен, 1 = активен) */
  isActive: z.number().min(0).max(1).default(1),
  /** Количество сессий */
  sessionsCount: z.number().min(1).default(1),
  /** Общее количество отправленных сообщений */
  totalMessagesSent: z.number().min(0).default(0),
  /** Общее количество полученных сообщений */
  totalMessagesReceived: z.number().min(0).default(0),
});

/** Тип записи пользовательских данных бота */
export type UserBotData = typeof userBotData.$inferSelect;

/** Тип для вставки пользовательских данных бота */
export type InsertUserBotData = z.infer<typeof insertUserBotDataSchema>;
