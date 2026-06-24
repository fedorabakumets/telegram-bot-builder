/**
 * @fileoverview Таблица версий проектов — история снимков для отката
 * @module shared/schema/tables/project-versions
 */

import { pgTable, serial, integer, jsonb, text, timestamp, bigint, index } from "drizzle-orm/pg-core";
import { z } from "zod";

import { botProjects } from "./bot-projects";
import { telegramUsers } from "./telegram-users";

/**
 * Таблица версий проектов — хранит снимки данных проекта (BotDataWithSheets)
 */
export const projectVersions = pgTable("project_versions", {
  /** Уникальный идентификатор версии */
  id: serial("id").primaryKey(),
  /** Идентификатор проекта (ссылка на bot_projects.id) */
  projectId: integer("project_id")
    .references(() => botProjects.id, { onDelete: "cascade" })
    .notNull(),
  /** Снимок данных проекта (BotDataWithSheets) */
  snapshot: jsonb("snapshot").notNull(),
  /** Опциональная метка версии (например имя проекта на момент снимка) */
  label: text("label"),
  /** Идентификатор автора снимка (ссылка на telegram_users.id) */
  authorId: bigint("author_id", { mode: "number" }).references(() => telegramUsers.id, { onDelete: "set null" }),
  /** Тип версии: "auto" — авто-снимок при сохранении, "manual" — ручной коммит-чекпоинт */
  kind: text("kind").notNull().default("auto"),
  /** Время создания версии */
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  /** Индекс по идентификатору проекта для быстрой выборки версий */
  projectIdx: index("idx_project_versions_project").on(table.projectId),
}));

/** Схема для вставки версии проекта */
export const insertProjectVersionSchema = z.object({
  /** Идентификатор проекта */
  projectId: z.number().int(),
  /** Снимок данных проекта */
  snapshot: z.unknown(),
  /** Опциональная метка версии */
  label: z.string().nullable().optional(),
  /** Идентификатор автора снимка */
  authorId: z.number().nullable().optional(),
  /** Тип версии: "auto" — авто-снимок, "manual" — ручной коммит */
  kind: z.enum(["auto", "manual"]).default("auto"),
});

/** Тип записи версии проекта */
export type ProjectVersion = typeof projectVersions.$inferSelect;

/** Тип для вставки версии проекта */
export type InsertProjectVersion = z.infer<typeof insertProjectVersionSchema>;
