/**
 * @fileoverview Таблица коллабораторов проекта
 * @module shared/schema/tables/project-collaborators
 */

import { pgTable, integer, bigint, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { botProjects } from "./bot-projects";
import { telegramUsers } from "./telegram-users";

/**
 * Таблица коллабораторов проекта.
 * Хранит связи между проектами и пользователями, имеющими доступ к ним.
 */
export const projectCollaborators = pgTable(
  "project_collaborators",
  {
    /** Идентификатор проекта (ссылка на bot_projects.id) */
    projectId: integer("project_id")
      .notNull()
      .references(() => botProjects.id, { onDelete: "cascade" }),

    /** Идентификатор пользователя-коллаборатора (ссылка на telegram_users.id) */
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => telegramUsers.id, { onDelete: "cascade" }),

    /** Идентификатор пользователя, пригласившего коллаборатора */
    invitedBy: bigint("invited_by", { mode: "number" })
      .references(() => telegramUsers.id, { onDelete: "set null" }),

    /** Дата добавления коллаборатора */
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    /** Составной первичный ключ: проект + пользователь */
    pk: primaryKey({ columns: [table.projectId, table.userId] }),
  })
);

/** Тип записи коллаборатора проекта */
export type ProjectCollaborator = typeof projectCollaborators.$inferSelect;

/** Тип для вставки коллаборатора проекта */
export type InsertProjectCollaborator = typeof projectCollaborators.$inferInsert;
