/**
 * @fileoverview Таблица персональных токенов агента (PAT) для внешних клиентов (MCP/CLI)
 * @module shared/schema/tables/agent-tokens
 */

import { pgTable, text, serial, timestamp, bigint, uniqueIndex } from "drizzle-orm/pg-core";
import { z } from "zod";

import { telegramUsers } from "./telegram-users";

/**
 * Таблица персональных токенов агента.
 * Сам секрет НЕ хранится — только его sha-256 хеш. Токен несёт личность владельца,
 * поэтому внешний клиент (MCP-сервер) работает только со своими проектами.
 */
export const agentTokens = pgTable("agent_tokens", {
  /** Уникальный идентификатор токена */
  id: serial("id").primaryKey(),
  /** Идентификатор владельца токена (ссылка на telegram_users.id) */
  ownerId: bigint("owner_id", { mode: "number" }).references(() => telegramUsers.id, { onDelete: "cascade" }).notNull(),
  /** Пользовательское имя токена для отображения */
  label: text("label").notNull(),
  /** Хеш токена (sha-256 hex) — уникальный индекс, сам токен не хранится */
  tokenHash: text("token_hash").notNull(),
  /** Префикс токена (первые ~12 символов) для отображения в списке */
  prefix: text("prefix").notNull(),
  /** Права токена через запятую (по умолчанию read,write) — задел под разграничение */
  scopes: text("scopes").default("read,write").notNull(),
  /** Дата создания токена */
  createdAt: timestamp("created_at").defaultNow(),
  /** Время последнего использования токена (обновляется при резолве) */
  lastUsedAt: timestamp("last_used_at"),
  /** Дата истечения токена (null — бессрочный) */
  expiresAt: timestamp("expires_at"),
  /** Дата отзыва токена (null — активен) */
  revokedAt: timestamp("revoked_at"),
}, (table) => ({
  /** Уникальный индекс по хешу токена — гарантирует уникальность и ускоряет резолв */
  tokenHashIdx: uniqueIndex("agent_tokens_token_hash_idx").on(table.tokenHash),
}));

/** Схема для вставки персонального токена агента */
export const insertAgentTokenSchema = z.object({
  /** Идентификатор владельца токена */
  ownerId: z.number().int(),
  /** Название токена (обязательное поле) */
  label: z.string().min(1, "Имя токена обязательно"),
  /** Хеш токена (sha-256 hex) */
  tokenHash: z.string().min(1, "Хеш токена обязателен"),
  /** Префикс токена для отображения */
  prefix: z.string().min(1, "Префикс токена обязателен"),
  /** Права токена через запятую */
  scopes: z.string().default("read,write"),
  /** Дата истечения токена */
  expiresAt: z.date().nullable().optional(),
});

/** Тип записи персонального токена агента */
export type AgentToken = typeof agentTokens.$inferSelect;

/** Тип для вставки персонального токена агента */
export type InsertAgentToken = typeof agentTokens.$inferInsert;
