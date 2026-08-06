/**
 * @fileoverview DELETE /api/projects/:projectId/users/:userId — удаление пользователя и его сообщений
 * @module server/routes/botUsers/handlers/deleteBotUserHandler
 */

import type { Request, Response } from "express";
import { pool as dbPool } from "../../../database/db";
import { getRequestTokenId, resolveEffectiveProjectTokenId } from "../../utils/resolve-request-token";

/**
 * Удаляет сообщения пользователя из bot_messages и строку из bot_users
 * @param req - Express request (projectId, userId в path; tokenId в query)
 * @param res - Express response
 */
export async function deleteBotUserHandler(req: Request, res: Response): Promise<void> {
  const projectId = parseInt(req.params.projectId, 10);
  const userId = req.params.userId;
  const requestedTokenId = getRequestTokenId(req);

  if (Number.isNaN(projectId)) {
    res.status(400).json({ message: "Некорректный projectId" });
    return;
  }

  try {
    const tokenId = await resolveEffectiveProjectTokenId(projectId, requestedTokenId);

    try {
      try {
        const deleteMessagesResult = await dbPool.query(
          `DELETE FROM bot_messages WHERE user_id = $1 AND project_id = $2 AND token_id = $3`,
          [userId, projectId, tokenId],
        );
        console.log(
          `Deleted ${deleteMessagesResult.rowCount || 0} messages from bot_messages for user ${userId}`,
        );
      } catch (dbError) {
        console.log("bot_messages table not found or error:", (dbError as Error).message);
      }

      const deleteResult = await dbPool.query(
        `DELETE FROM bot_users WHERE user_id = $1 AND project_id = $2 AND token_id = $3`,
        [userId, projectId, tokenId],
      );

      if (deleteResult.rowCount && deleteResult.rowCount > 0) {
        console.log(`Deleted user ${userId} from bot_users table`);
        res.json({ message: "User data deleted successfully" });
        return;
      }
    } catch (dbError) {
      console.log("bot_users delete error:", (dbError as Error).message);
      res.status(404).json({ message: "User data not found" });
      return;
    }

    res.json({ message: "User data deleted successfully" });
  } catch (error) {
    console.error("Failed to delete user data:", error);
    res.status(500).json({ message: "Failed to delete user data" });
  }
}
