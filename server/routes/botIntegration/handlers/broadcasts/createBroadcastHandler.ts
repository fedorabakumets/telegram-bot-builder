/**
 * @fileoverview Хендлер создания и запуска рассылки
 * @module botIntegration/handlers/broadcasts/createBroadcastHandler
 */

import type { Request, Response } from "express";
import type { BroadcastFilters } from "@shared/schema";
import { storage } from "../../../../storages/storage";
import { getRequestTokenId, resolveEffectiveProjectToken } from "../../../utils/resolve-request-token";
import { buildBroadcastDefaultName } from "./build-broadcast-default-name";
import { createBroadcastBodySchema } from "./broadcast-body-schemas";
import { runBroadcastQueue } from "./broadcastQueue";
import { resolveProjectTokenIds } from "./resolve-project-token-ids";
import { startBroadcastCampaign } from "./start-campaign-broadcasts";
import {
  assertGroupsBelongToToken,
  normalizeGroupsByTokenId,
  resolveGroupIdsForToken,
} from "./validate-groups-by-token";

/**
 * Обрабатывает POST /api/projects/:projectId/broadcasts
 * @param req - Объект запроса
 * @param res - Объект ответа
 * @returns void
 */
export async function createBroadcastHandler(req: Request, res: Response): Promise<void> {
  try {
    const projectId = Number.parseInt(req.params.projectId, 10);
    if (Number.isNaN(projectId)) {
      res.status(400).json({ message: "Неверный ID проекта" });
      return;
    }

    const validation = createBroadcastBodySchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ message: "Неверное тело запроса", errors: validation.error.errors });
      return;
    }

    const {
      name,
      messageText,
      mediaUrls,
      buttons,
      buttonsPerRow,
      filters,
      tokenIds,
      groupsByTokenId,
    } = validation.data;
    const resolvedName = name.trim() || buildBroadcastDefaultName(messageText);
    const groupsByToken = normalizeGroupsByTokenId(groupsByTokenId);

    // Явно выбранные боты — «большая рассылка»
    if (tokenIds && tokenIds.length > 0) {
      const resolved = await resolveProjectTokenIds(projectId, tokenIds);
      if (resolved.error) {
        res.status(400).json({ message: resolved.error });
        return;
      }

      for (const [tid] of groupsByToken) {
        if (!tokenIds.includes(tid)) {
          res.status(400).json({ message: `groupsByTokenId содержит чужой токен ${tid}` });
          return;
        }
      }

      for (const token of resolved.tokens) {
        const gids = resolveGroupIdsForToken(token.id, groupsByToken, filters.groupIds);
        const err = await assertGroupsBelongToToken(projectId, token.id, gids);
        if (err) {
          res.status(400).json({ message: err });
          return;
        }
      }

      if (resolved.tokens.length > 1) {
        const started = await startBroadcastCampaign(
          {
            projectId,
            name: resolvedName,
            messageText,
            mediaUrls,
            buttons,
            buttonsPerRow,
            filters,
            groupsByToken,
          },
          resolved.tokens,
        );
        res.status(201).json(started);
        return;
      }
    }

    const requestedTokenId = tokenIds?.[0] ?? getRequestTokenId(req);
    const { selectedToken, effectiveTokenId } = await resolveEffectiveProjectToken(
      projectId,
      requestedTokenId,
    );

    if (!selectedToken || effectiveTokenId === null) {
      res.status(400).json({ message: "Токен бота не найден для этого проекта" });
      return;
    }

    const groupIds = resolveGroupIdsForToken(effectiveTokenId, groupsByToken, filters.groupIds);
    const belongErr = await assertGroupsBelongToToken(projectId, effectiveTokenId, groupIds);
    if (belongErr) {
      res.status(400).json({ message: belongErr });
      return;
    }

    const childFilters: BroadcastFilters = {
      ...filters,
      ...(groupIds.length ? { groupIds } : { groupIds: undefined }),
    };

    const users = await storage.getUsersForBroadcast(projectId, effectiveTokenId, childFilters);
    const totalCount = users.length;

    const broadcast = await storage.createBroadcast({
      projectId,
      tokenId: effectiveTokenId,
      name: resolvedName,
      messageText,
      mediaUrls,
      buttons,
      buttonsPerRow,
      filters: childFilters,
      status: "running",
      totalCount,
      startedAt: new Date(),
    });

    runBroadcastQueue(broadcast.id, selectedToken.token).catch((err) => {
      console.error(`[broadcast] Ошибка очереди рассылки ${broadcast.id}:`, err);
    });

    res.status(201).json({ broadcastId: broadcast.id });
  } catch (error) {
    console.error("[createBroadcastHandler] Ошибка:", error);
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
}
