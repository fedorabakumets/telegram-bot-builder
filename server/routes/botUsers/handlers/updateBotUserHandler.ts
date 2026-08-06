/**
 * @fileoverview PUT /api/projects/:projectId/users/:userId — обновление bot_users
 * @module server/routes/botUsers/handlers/updateBotUserHandler
 */

import type { Request, Response } from "express";
import { pool as dbPool } from "../../../database/db";
import { getRequestTokenId, resolveEffectiveProjectTokenId } from "../../utils/resolve-request-token";

/**
 * Обновляет поля пользователя бота (сейчас — is_active) в bot_users
 * @param req - Express request (projectId, userId в path; tokenId в query)
 * @param res - Express response
 */
export async function updateBotUserHandler(req: Request, res: Response): Promise<void> {
  const projectId = parseInt(req.params.projectId, 10);
  const userId = req.params.userId;
  const requestedTokenId = getRequestTokenId(req);

  if (Number.isNaN(projectId)) {
    res.status(400).json({ message: "Некорректный projectId" });
    return;
  }

  try {
    const effectiveTokenId = await resolveEffectiveProjectTokenId(projectId, requestedTokenId);
    const updateFields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (req.body.isActive !== undefined) {
      updateFields.push(`is_active = $${paramIndex++}`);
      values.push(
        req.body.isActive === 1 || req.body.isActive === true || req.body.isActive === "1" ? 1 : 0,
      );
    }

    if (updateFields.length === 0) {
      res.status(400).json({ message: "No valid fields to update" });
      return;
    }

    const query = `
      UPDATE bot_users
      SET ${updateFields.join(", ")}, last_interaction = NOW()
      WHERE user_id = $${paramIndex} AND project_id = $${paramIndex + 1} AND token_id = $${paramIndex + 2}
      RETURNING *
    `;
    values.push(userId, projectId, effectiveTokenId);

    const result = await dbPool.query(query, values);

    if (result.rows.length === 0) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Ошибка обновления пользователя в bot_users:", error);
    res.status(500).json({ message: "Failed to update user data" });
  }
}
