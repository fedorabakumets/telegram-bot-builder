/**
 * @fileoverview Таблица групп бота
 * @module shared/schema/tables/bot-groups
 */

import { pgTable, text, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { botProjects } from "./bot-projects";

/**
 * Таблица групп бота
 */
export const botGroups = pgTable("bot_groups", {
  /** Уникальный идентификатор группы */
  id: serial("id").primaryKey(),
  /** Идентификатор проекта (ссылка на bot_projects.id) */
  projectId: integer("project_id").references(() => botProjects.id, { onDelete: "cascade" }).notNull(),
  /** Идентификатор группы в Telegram */
  groupId: text("group_id"),
  /** Отображаемое название группы */
  name: text("name").notNull(),
  /** Ссылка на группу */
  url: text("url").notNull(),
  /** Флаг администратора (0 = участник, 1 = администратор) */
  isAdmin: integer("is_admin").default(0),
  /** Количество участников */
  memberCount: integer("member_count"),
  /** Флаг активности (0 = неактивная, 1 = активная) */
  isActive: integer("is_active").default(1),
  /** Описание группы */
  description: text("description"),
  /** Настройки группы */
  settings: jsonb("settings").default({}),
  /** URL аватарки группы */
  avatarUrl: text("avatar_url"),
  /** Тип чата ("group", "supergroup", "channel") */
  chatType: text("chat_type").default("group"),
  /** Пригласительная ссылка */
  inviteLink: text("invite_link"),
  /** Права администратора бота в группе */
  adminRights: jsonb("admin_rights").default({
    can_manage_chat: false,
    can_change_info: false,
    can_delete_messages: false,
    can_invite_users: false,
    can_restrict_members: false,
    can_pin_messages: false,
    can_promote_members: false,
    can_manage_video_chats: false
  }),
  /** Количество сообщений в группе */
  messagesCount: integer("messages_count").default(0),
  /** Количество активных пользователей */
  activeUsers: integer("active_users").default(0),
  /** Дата последней активности */
  lastActivity: timestamp("last_activity"),
  /** Флаг публичности (0 = частная, 1 = публичная) */
  isPublic: integer("is_public").default(0),
  /** Основной язык группы */
  language: text("language").default("ru"),
  /** Часовой пояс группы */
  timezone: text("timezone"),
  /** Теги для категоризации */
  tags: text("tags").array().default([]),
  /** Заметки администратора */
  notes: text("notes"),
  /** Дата создания группы */
  createdAt: timestamp("created_at").defaultNow(),
  /** Дата последнего обновления группы */
  updatedAt: timestamp("updated_at").defaultNow(),
});

/** Схема для вставки данных группы бота */
export const insertBotGroupSchema = createInsertSchema(botGroups).pick({
  /** Идентификатор проекта (ссылка на bot_projects.id) */
  projectId: true,
  /** Идентификатор группы в Telegram */
  groupId: true,
  /** Отображаемое название группы */
  name: true,
  /** Ссылка на группу */
  url: true,
  /** Флаг администратора */
  isAdmin: true,
  /** Количество участников */
  memberCount: true,
  /** Флаг активности */
  isActive: true,
  /** Описание группы */
  description: true,
  /** Настройки группы */
  settings: true,
  /** URL аватарки группы */
  avatarUrl: true,
  /** Тип чата */
  chatType: true,
  /** Пригласительная ссылка */
  inviteLink: true,
  /** Права администратора бота в группе */
  adminRights: true,
  /** Количество сообщений в группе */
  messagesCount: true,
  /** Количество активных пользователей */
  activeUsers: true,
  /** Дата последней активности */
  lastActivity: true,
  /** Флаг публичности */
  isPublic: true,
  /** Основной язык группы */
  language: true,
  /** Часовой пояс группы */
  timezone: true,
  /** Теги для категоризации */
  tags: true,
  /** Заметки администратора */
  notes: true,
}).extend({
  /** Название группы (обязательное поле) */
  name: z.string().min(1, "Название группы обязательно"),
  /** Ссылка на группу (может быть пустой для числовых ID групп) */
  url: z.string().optional().default(""),
  /** Флаг администратора (0 = участник, 1 = администратор) */
  isAdmin: z.number().min(0).max(1).default(0),
  /** Флаг активности (0 = неактивная, 1 = активная) */
  isActive: z.number().min(0).max(1).default(1),
  /** Флаг публичности (0 = частная, 1 = публичная) */
  isPublic: z.number().min(0).max(1).default(0),
  /** Настройки группы */
  settings: z.record(z.any()).default({}),
  /** Права администратора */
  adminRights: z.record(z.any()).default({
    can_manage_chat: false,
    can_change_info: false,
    can_delete_messages: false,
    can_invite_users: false,
    can_restrict_members: false,
    can_pin_messages: false,
    can_promote_members: false,
    can_manage_video_chats: false
  }),
  /** Язык группы */
  language: z.enum(["ru", "en", "es", "fr", "de", "it", "pt", "zh", "ja", "ko"]).default("ru"),
  /** Тип чата ("group", "supergroup", "channel") */
  chatType: z.enum(["group", "supergroup", "channel"]).default("group"),
  /** Теги группы */
  tags: z.array(z.string()).default([]),
  /** Количество сообщений в группе */
  messagesCount: z.number().min(0).default(0),
  /** Количество активных пользователей */
  activeUsers: z.number().min(0).default(0),
});

/** Тип записи группы бота */
export type BotGroup = typeof botGroups.$inferSelect;

/** Тип для вставки группы бота */
export type InsertBotGroup = z.infer<typeof insertBotGroupSchema>;
