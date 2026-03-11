/**
 * @fileoverview Таблица сценариев ботов
 * @module shared/schema/tables/bot-templates
 */

import { pgTable, text, serial, integer, jsonb, timestamp, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { telegramUsers } from "./telegram-users";

/**
 * Таблица сценариев ботов
 */
export const botTemplates = pgTable("bot_templates", {
  /** Уникальный идентификатор сценария */
  id: serial("id").primaryKey(),
  /** Идентификатор владельца сценария (null для официальных сценариев) */
  ownerId: bigint("owner_id", { mode: "number" }).references(() => telegramUsers.id, { onDelete: "cascade" }),
  /** Название сценария */
  name: text("name").notNull(),
  /** Описание сценария */
  description: text("description"),
  /** JSON-данные сценария (структура узлов, соединений и т.д.) */
  data: jsonb("data").notNull(),
  /** Категория сценария */
  category: text("category").default("custom"),
  /** Теги сценария */
  tags: text("tags").array(),
  /** Флаг публичности (0 = приватный, 1 = публичный) */
  isPublic: integer("is_public").default(0),
  /** Уровень сложности ("easy", "medium", "hard") */
  difficulty: text("difficulty").default("easy"),
  /** Идентификатор автора сценария (устаревшее, использовать ownerId) */
  authorId: text("author_id"),
  /** Имя автора сценария */
  authorName: text("author_name"),
  /** Количество использований сценария */
  useCount: integer("use_count").notNull().default(0),
  /** Рейтинг сценария (от 1 до 5) */
  rating: integer("rating").notNull().default(0),
  /** Количество оценок сценария */
  ratingCount: integer("rating_count").notNull().default(0),
  /** Флаг рекомендуемости (0 = не рекомендуемый, 1 = рекомендуемый) */
  featured: integer("featured").notNull().default(0),
  /** Версия сценария */
  version: text("version").default("1.0.0"),
  /** URL изображения для предварительного просмотра */
  previewImage: text("preview_image"),
  /** Время последнего использования сценария */
  lastUsedAt: timestamp("last_used_at"),
  /** Количество скачиваний сценария */
  downloadCount: integer("download_count").notNull().default(0),
  /** Количество лайков сценария */
  likeCount: integer("like_count").notNull().default(0),
  /** Количество закладок сценария */
  bookmarkCount: integer("bookmark_count").notNull().default(0),
  /** Количество просмотров сценария */
  viewCount: integer("view_count").notNull().default(0),
  /** Язык сценария */
  language: text("language").default("ru"),
  /** Флаг требования токена (0 = не требуется, 1 = требуется) */
  requiresToken: integer("requires_token").notNull().default(0),
  /** Сложность сценария (от 1 до 10) */
  complexity: integer("complexity").notNull().default(1),
  /** Примерное время настройки в минутах */
  estimatedTime: integer("estimated_time").notNull().default(5),
  /** Дата создания сценария */
  createdAt: timestamp("created_at").defaultNow(),
  /** Дата последнего обновления сценария */
  updatedAt: timestamp("updated_at").defaultNow(),
});

/** Схема для вставки данных сценария бота */
export const insertBotTemplateSchema = createInsertSchema(botTemplates).pick({
  /** Идентификатор владельца сценария */
  ownerId: true,
  /** Название сценария */
  name: true,
  /** Описание сценария */
  description: true,
  /** JSON-данные сценария */
  data: true,
  /** Категория сценария */
  category: true,
  /** Теги сценария */
  tags: true,
  /** Флаг публичности (0 = приватный, 1 = публичный) */
  isPublic: true,
  /** Уровень сложности */
  difficulty: true,
  /** Идентификатор автора сценария */
  authorId: true,
  /** Имя автора сценария */
  authorName: true,
  /** Версия сценария */
  version: true,
  /** URL изображения для предварительного просмотра */
  previewImage: true,
  /** Флаг рекомендуемости */
  featured: true,
  /** Язык сценария */
  language: true,
  /** Флаг требования токена */
  requiresToken: true,
  /** Сложность сценария (от 1 до 10) */
  complexity: true,
  /** Примерное время настройки в минутах */
  estimatedTime: true,
}).extend({
  /** Идентификатор владельца сценария */
  ownerId: z.number().nullable().optional(),
  /** Категория сценария */
  category: z.enum(["custom", "business", "entertainment", "education", "utility", "games", "official", "community"]).default("custom"),
  /** Уровень сложности */
  difficulty: z.enum(["easy", "medium", "hard"]).default("easy"),
  /** Язык сценария */
  language: z.enum(["ru", "en", "es", "fr", "de", "it", "pt", "zh", "ja", "ko"]).default("ru"),
  /** Сложность сценария (от 1 до 10) */
  complexity: z.number().min(1).max(10).default(1),
  /** Примерное время настройки в минутах */
  estimatedTime: z.number().min(1).max(120).default(5),
  /** Рейтинг сценария (от 1 до 5) */
  rating: z.number().min(1).max(5).optional(),
});

/** Тип записи сценария бота */
export type BotTemplate = typeof botTemplates.$inferSelect;

/** Тип для вставки сценария бота */
export type InsertBotTemplate = z.infer<typeof insertBotTemplateSchema>;
