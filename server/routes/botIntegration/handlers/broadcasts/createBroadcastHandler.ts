/**
 * @fileoverview Хендлер создания и запуска рассылки
 * @module botIntegration/handlers/broadcasts/createBroadcastHandler
 */

import type { Request, Response } from "express";
import type { BroadcastFilters } from "@shared/schema";
import { BOT_UNAUTHORIZED_HINT, isTokenActiveForBroadcast } from "@shared/broadcast-unauthorized";
import { storage } from "../../../../storages/storage";
import { getRequestTokenId, resolveEffectiveProjectToken } from "../../../utils/resolve-request-token";
import { buildBroadcastDefaultName } from "./build-broadcast-default-name";
import { createBroadcastBodySchema } from "./broadcast-body-schemas";
import { runBroadcastQueue } from "./broadcastQueue";
import { startSelectedTokensBroadcast } from "./start-selected-tokens-broadcast";
import {
  assertGroupsBelongToToken,
  normalizeGroupsByTokenId,
  resolveGroupIdsForToken,
} from "./validate-groups-by-token";

/**
 * Обрабатывает POST /api/projects/:projectId/broadcasts
 * @param req - Объект запроса
 * @param res - Объект ответа
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

    const { name, messageText, mediaUrls, buttons, buttonsPerRow, filters, tokenIds, groupsByTokenId } =
      validation.data;
    const resolvedName = name.trim() || buildBroadcastDefaultName(messageText);
    const groupsByToken = normalizeGroupsByTokenId(groupsByTokenId);
    let singleTokenId = tokenIds?.[0] ?? getRequestTokenId(req);

    if (tokenIds && tokenIds.length > 0) {
      const selected = await startSelectedTokensBroadcast(
        { projectId, name: resolvedName, messageText, mediaUrls, buttons, buttonsPerRow, filters, groupsByToken },
        tokenIds,
        groupsByToken,
      );
      if (selected.kind === "error") {
        res.status(400).json({ message: selected.message });
        return;
      }
      if (selected.kind === "campaign") {
        res.status(201).json(selected.started);
        return;
      }
      singleTokenId = selected.token.id;
    }

    const { selectedToken, effectiveTokenId } = await resolveEffectiveProjectToken(projectId, singleTokenId);
    if (!selectedToken || effectiveTokenId === null) {
      res.status(400).json({ message: "Токен бота не найден для этого проекта" });
      return;
    }
    if (!isTokenActiveForBroadcast(selectedToken.isActive)) {
      res.status(400).json({ message: BOT_UNAUTHORIZED_HINT });
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
      totalCount: users.length,
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
