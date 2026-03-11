/**
 * @fileoverview Таблица участников групп
 * @module shared/schema/tables/group-members
 */

import { pgTable, text, serial, integer, jsonb, timestamp, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { botGroups } from "./bot-groups";

/**
 * Таблица участников групп
 */
export const groupMembers = pgTable("group_members", {
  /** Уникальный идентификатор участника */
  id: serial("id").primaryKey(),
  /** Идентификатор группы (ссылка на bot_groups.id) */
  groupId: integer("group_id").references(() => botGroups.id, { onDelete: "cascade" }).notNull(),
  /** Идентификатор пользователя в Telegram */
  userId: bigint("user_id", { mode: "number" }).notNull(),
  /** Имя пользователя в Telegram */
  username: text("username"),
  /** Имя пользователя */
  firstName: text("first_name"),
  /** Фамилия пользователя */
  lastName: text("last_name"),
  /** Статус участника */
  status: text("status").default("member"),
  /** Флаг бота (0 = человек, 1 = бот) */
  isBot: integer("is_bot").default(0),
  /** Права администратора (если пользователь админ) */
  adminRights: jsonb("admin_rights").default({}),
  /** Кастомный титул администратора */
  customTitle: text("custom_title"),
  /** Ограничения (если пользователь ограничен) */
  restrictions: jsonb("restrictions").default({}),
  /** Дата окончания ограничения */
  restrictedUntil: timestamp("restricted_until"),
  /** Дата вступления в группу */
  joinedAt: timestamp("joined_at").defaultNow(),
  /** Дата последнего появления */
  lastSeen: timestamp("last_seen"),
  /** Количество сообщений участника */
  messageCount: integer("message_count").default(0),
  /** Флаг активности (0 = неактивен, 1 = активен) */
  isActive: integer("is_active").default(1),
  /** Дата создания записи */
  createdAt: timestamp("created_at").defaultNow(),
  /** Дата последнего обновления записи */
  updatedAt: timestamp("updated_at").defaultNow(),
});

/** Схема для вставки данных участника группы */
export const insertGroupMemberSchema = createInsertSchema(groupMembers).pick({
  /** Идентификатор группы (ссылка на bot_groups.id) */
  groupId: true,
  /** Идентификатор пользователя в Telegram */
  userId: true,
  /** Имя пользователя в Telegram */
  username: true,
  /** Имя пользователя */
  firstName: true,
  /** Фамилия пользователя */
  lastName: true,
  /** Статус участника */
  status: true,
  /** Флаг бота (0 = человек, 1 = бот) */
  isBot: true,
  /** Права администратора */
  adminRights: true,
  /** Кастомный титул администратора */
  customTitle: true,
  /** Ограничения участника */
  restrictions: true,
  /** Дата окончания ограничения */
  restrictedUntil: true,
  /** Дата вступления в группу */
  joinedAt: true,
  /** Дата последнего появления */
  lastSeen: true,
  /** Количество сообщений участника */
  messageCount: true,
  /** Флаг активности (0 = неактивен, 1 = активен) */
  isActive: true,
}).extend({
  /** Идентификатор пользователя (должен быть положительным числом) */
  userId: z.number().positive("ID пользователя должен быть положительным числом"),
  /** Статус участника ("creator", "administrator", "member", "restricted", "left", "kicked") */
  status: z.enum(["creator", "administrator", "member", "restricted", "left", "kicked"]).default("member"),
  /** Флаг бота (0 = человек, 1 = бот) */
  isBot: z.number().min(0).max(1).default(0),
  /** Флаг активности (0 = неактивен, 1 = активен) */
  isActive: z.number().min(0).max(1).default(1),
  /** Права администратора */
  adminRights: z.record(z.any()).default({}),
  /** Ограничения участника */
  restrictions: z.record(z.any()).default({}),
  /** Количество сообщений участника */
  messageCount: z.number().min(0).default(0),
});

/** Тип записи участника группы */
export type GroupMember = typeof groupMembers.$inferSelect;

/** Тип для вставки участника группы */
export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;
