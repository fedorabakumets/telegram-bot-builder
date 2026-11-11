/** @fileoverview Запросы пользователей с обязательной областью проекта и токена. */
import { pool } from "../../../../database/db";
import type { BotUsersAccess } from "./bot-users-access";
import type { BotUsersPagination } from "./bot-users-params";
/**
 * Загружает страницу пользователей в стабильном порядке.
 * @param access - Проверенная область доступа.
 * @param pagination - Проверенные границы страницы.
 * @returns Страница и полное количество пользователей.
 */
export async function listBotTokenUsers(access: BotUsersAccess, pagination: BotUsersPagination) {
  const { projectId, tokenId } = access;
  const countResult = await pool.query<{ total: string }>(
    `SELECT COUNT(*) AS total FROM bot_users WHERE project_id = $1 AND token_id = $2 AND is_bot = 0`,
    [projectId, tokenId],
  );
  const result = await pool.query(
    `SELECT bu.user_id AS "userId", bu.username AS "userName", bu.first_name AS "firstName",
      bu.last_name AS "lastName", bu.avatar_url AS "avatarUrl", bu.registered_at AS "registeredAt",
      bu.last_interaction AS "lastInteraction", bu.interaction_count AS "interactionCount",
      bu.is_active AS "isActive", bu.user_data AS "userData"
     FROM bot_users bu WHERE bu.project_id = $1 AND bu.token_id = $2 AND bu.is_bot = 0
     ORDER BY bu.last_interaction DESC, bu.user_id DESC LIMIT $3 OFFSET $4`,
    [projectId, tokenId, pagination.limit, pagination.offset],
  );
  return { items: result.rows, count: Number(countResult.rows[0]?.total ?? "0") };
}
/**
 * Загружает одного пользователя в проверенной области доступа.
 * @param access - Проверенный проект и токен.
 * @param userId - Проверенный идентификатор Telegram.
 * @returns Запись пользователя либо отсутствие записи.
 */
export async function findBotTokenUser(access: BotUsersAccess, userId: string) {
  const result = await pool.query(
    `SELECT user_id AS "userId", username AS "userName", first_name AS "firstName",
      last_name AS "lastName", registered_at AS "registeredAt", last_interaction AS "lastInteraction",
      interaction_count AS "interactionCount", is_active AS "isActive"
     FROM bot_users WHERE project_id = $1 AND token_id = $2 AND user_id = $3 LIMIT 1`,
    [access.projectId, access.tokenId, userId],
  );
  return result.rows[0];
}
