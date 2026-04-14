/**
 * @fileoverview Таблица токенов ботов
 * @module shared/schema/tables/bot-tokens
 */

import { pgTable, text, serial, integer, timestamp, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { botProjects } from "./bot-projects";
import { telegramUsers } from "./telegram-users";

/**
 * Таблица токенов ботов
 */
export const botTokens = pgTable("bot_tokens", {
  /** Уникальный идентификатор токена */
  id: serial("id").primaryKey(),
  /** Идентификатор проекта (ссылка на bot_projects.id) */
  projectId: integer("project_id").references(() => botProjects.id, { onDelete: "cascade" }).notNull(),
  /** Идентификатор владельца токена (наследуется от проекта) */
  ownerId: bigint("owner_id", { mode: "number" }).references(() => telegramUsers.id, { onDelete: "cascade" }),
  /** Пользовательское имя для токена */
  name: text("name").notNull(),
  /** Токен бота (хранится в зашифрованном виде) */
  token: text("token").notNull(),
  /** Флаг токена по умолчанию (0 = нет, 1 = да) */
  isDefault: integer("is_default").default(0),
  /** Флаг активности токена (0 = неактивен, 1 = активен) */
  isActive: integer("is_active").default(1),
  /** Описание токена */
  description: text("description"),
  /** Имя бота из Telegram API */
  botFirstName: text("bot_first_name"),
  /** Имя пользователя бота (@username) из Telegram API */
  botUsername: text("bot_username"),
  /** Полное описание бота из Telegram API */
  botDescription: text("bot_description"),
  /** Короткое описание бота из Telegram API */
  botShortDescription: text("bot_short_description"),
  /** URL аватарки бота из Telegram API */
  botPhotoUrl: text("bot_photo_url"),
  /** Флаг возможности бота присоединяться к группам */
  botCanJoinGroups: integer("bot_can_join_groups"),
  /** Флаг возможности бота читать все сообщения в группах */
  botCanReadAllGroupMessages: integer("bot_can_read_all_group_messages"),
  /** Флаг поддержки инлайн-запросов ботом */
  botSupportsInlineQueries: integer("bot_supports_inline_queries"),
  /** Флаг наличия главного веб-приложения у бота */
  botHasMainWebApp: integer("bot_has_main_web_app"),
  /** Время последнего использования токена */
  lastUsedAt: timestamp("last_used_at"),
  /** Флаг отслеживания времени выполнения (0 = выключено, 1 = включено) */
  trackExecutionTime: integer("track_execution_time").default(0),
  /** Общее время выполнения в секундах */
  totalExecutionSeconds: integer("total_execution_seconds").default(0),
  /** Флаг автоперезапуска при краше (0 = выключено, 1 = включено) */
  autoRestart: integer("auto_restart").default(0),
  /** Максимальное количество попыток автоперезапуска подряд */
  maxRestartAttempts: integer("max_restart_attempts").default(3),
  /** Уровень логирования Python-бота (DEBUG, INFO, WARNING, ERROR) */
  logLevel: text("log_level").default("WARNING"),
  /** Дата создания токена */
  createdAt: timestamp("created_at").defaultNow(),
  /** Дата последнего обновления токена */
  updatedAt: timestamp("updated_at").defaultNow(),
});

/** Схема для вставки данных токена бота */
export const insertBotTokenSchema = createInsertSchema(botTokens).pick({
  /** Идентификатор проекта (ссылка на bot_projects.id) */
  projectId: true,
  /** Идентификатор владельца токена (наследуется от проекта) */
  ownerId: true,
  /** Пользовательское имя для токена */
  name: true,
  /** Токен бота (хранится в зашифрованном виде) */
  token: true,
  /** Флаг токена по умолчанию (0 = нет, 1 = да) */
  isDefault: true,
  /** Флаг активности токена (0 = неактивен, 1 = активен) */
  isActive: true,
  /** Описание токена */
  description: true,
  /** Имя бота из Telegram API */
  botFirstName: true,
  /** Имя пользователя бота (@username) из Telegram API */
  botUsername: true,
  /** Полное описание бота из Telegram API */
  botDescription: true,
  /** Короткое описание бота из Telegram API */
  botShortDescription: true,
  /** URL аватарки бота из Telegram API */
  botPhotoUrl: true,
  /** Флаг возможности бота присоединяться к группам */
  botCanJoinGroups: true,
  /** Флаг возможности бота читать все сообщения в группах */
  botCanReadAllGroupMessages: true,
  /** Флаг поддержки инлайн-запросов ботом */
  botSupportsInlineQueries: true,
  /** Флаг наличия главного веб-приложения у бота */
  botHasMainWebApp: true,
  /** Флаг отслеживания времени выполнения (0 = выключено, 1 = включено) */
  trackExecutionTime: true,
  /** Общее время выполнения в секундах */
  totalExecutionSeconds: true,
  /** Флаг автоперезапуска при краше (0 = выключено, 1 = включено) */
  autoRestart: true,
  /** Максимальное количество попыток автоперезапуска подряд */
  maxRestartAttempts: true,
}).extend({
  /** Идентификатор владельца токена */
  ownerId: z.number().nullable().optional(),
  /** Название токена (обязательное поле) */
  name: z.string().min(1, "Имя токена обязательно"),
  /** Токен бота (обязательное поле) */
  token: z.string().min(1, "Токен обязателен"),
  /** Флаг токена по умолчанию (0 = нет, 1 = да) */
  isDefault: z.number().min(0).max(1).default(0),
  /** Флаг активности токена (0 = неактивен, 1 = активен) */
  isActive: z.number().min(0).max(1).default(1),
  /** Флаг возможности бота присоединяться к группам */
  botCanJoinGroups: z.number().min(0).max(1).optional(),
  /** Флаг возможности бота читать все сообщения в группах */
  botCanReadAllGroupMessages: z.number().min(0).max(1).optional(),
  /** Флаг поддержки инлайн-запросов ботом */
  botSupportsInlineQueries: z.number().min(0).max(1).optional(),
  /** Флаг наличия главного веб-приложения у бота */
  botHasMainWebApp: z.number().min(0).max(1).optional(),
  /** Флаг отслеживания времени выполнения (0 = выключено, 1 = включено) */
  trackExecutionTime: z.number().min(0).max(1).default(0),
  /** Общее время выполнения в секундах */
  totalExecutionSeconds: z.number().min(0).default(0),
  /** Флаг автоперезапуска при краше (0 = выключено, 1 = включено) */
  autoRestart: z.number().min(0).max(1).default(0),
  /** Максимальное количество попыток автоперезапуска подряд */
  maxRestartAttempts: z.number().min(1).max(10).default(3),
  /** Уровень логирования Python-бота (DEBUG, INFO, WARNING, ERROR) */
  logLevel: z.enum(['DEBUG', 'INFO', 'WARNING', 'ERROR']).default('WARNING').optional(),
});

/** Тип записи токена бота */
export type BotToken = typeof botTokens.$inferSelect;

/** Тип для вставки токена бота */
export type InsertBotToken = z.infer<typeof insertBotTokenSchema>;
