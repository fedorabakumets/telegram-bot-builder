/**
 * @fileoverview OpenAPI-схема списка удалённых и заблокировавших.
 * @module server/swagger/schemas/unavailable-users
 */
import "./common";
import { z } from "zod";

/** Человек без текста сообщений и без секретов. */
export const UnavailableUserSchema = z.object({
  /** Telegram user id. */
  userId: z.string().openapi({ example: "8791555566" }),
  /** Username или null. */
  userName: z.string().nullable().openapi({ example: "Ho4y28" }),
  /** Имя или null. */
  firstName: z.string().nullable().openapi({ example: "." }),
  /** Фамилия или null. */
  lastName: z.string().nullable().openapi({ example: null }),
  /** Аккаунт удалён. */
  isDeleted: z.boolean().openapi({ example: true }),
  /** Заблокировал бота. */
  isBlocked: z.boolean().openapi({ example: false }),
}).openapi("UnavailableUser");

/** Страница GET /users/unavailable. */
export const UnavailableUsersPageSchema = z.object({
  /** Люди страницы. */
  users: z.array(UnavailableUserSchema),
  /** Всего подходит под фильтр. */
  total: z.number().openapi({ example: 2 }),
  /** Есть следующая страница. */
  hasMore: z.boolean().openapi({ example: false }),
  /** Размер страницы. */
  limit: z.number().openapi({ example: 20 }),
  /** Смещение. */
  offset: z.number().openapi({ example: 0 }),
}).openapi("UnavailableUsersPage");

/** Path-параметр проекта. */
export const UnavailableUsersParamsSchema = z.object({
  /** Числовой ID проекта. */
  projectId: z.string().openapi({ example: "12", param: { description: "ID проекта", example: "12" } }),
});

/** Фильтр и страница. tokenId обязателен. */
export const UnavailableUsersQuerySchema = z.object({
  /** ID записи бота. */
  tokenId: z.string().openapi({ example: "10", param: { description: "ID бота", example: "10" } }),
  /** deleted, blocked или both. */
  kind: z.enum(["deleted", "blocked", "both"]).optional().openapi({ example: "both" }),
  /** 1–50, по умолчанию 20. */
  limit: z.string().optional().openapi({ example: "20" }),
  /** Смещение, по умолчанию 0. */
  offset: z.string().optional().openapi({ example: "0" }),
});
