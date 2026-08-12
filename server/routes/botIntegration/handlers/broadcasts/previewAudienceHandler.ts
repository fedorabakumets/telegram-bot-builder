/**
 * @fileoverview Хендлер предпросмотра аудитории рассылки (один бот или несколько)
 * @module botIntegration/handlers/broadcasts/previewAudienceHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import { getRequestTokenId, resolveEffectiveProjectToken } from "../../../utils/resolve-request-token";
import { previewAudienceBodySchema } from "./broadcast-body-schemas";
import { resolveProjectTokenIds } from "./resolve-project-token-ids";
import { estimateAudienceOverlap, type TokenAudience } from "./overlap-estimate";
import type { BroadcastFilters } from "@shared/schema";

/**
 * Обрабатывает POST /api/projects/:projectId/broadcasts/preview-audience
 * Для одного бота возвращает count и 3 примера, для нескольких — суммарную
 * аудиторию с разбивкой по ботам и оценкой пересечения
 * @param req - Объект запроса
 * @param res - Объект ответа
 * @returns void
 */
export async function previewAudienceHandler(req: Request, res: Response): Promise<void> {
  try {
    const projectId = Number.parseInt(req.params.projectId, 10);
    if (Number.isNaN(projectId)) {
      res.status(400).json({ message: "Неверный ID проекта" });
      return;
    }

    const validation = previewAudienceBodySchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ message: "Неверное тело запроса", errors: validation.error.errors });
      return;
    }

    const { filters, tokenIds } = validation.data;

    if (tokenIds && tokenIds.length > 0) {
      const resolved = await resolveProjectTokenIds(projectId, tokenIds);
      if (resolved.error) {
        res.status(400).json({ message: resolved.error });
        return;
      }
      await respondMultiBotPreview(res, projectId, resolved.tokens.map((t) => t.id), filters);
      return;
    }

    const { selectedToken, effectiveTokenId } = await resolveEffectiveProjectToken(
      projectId,
      getRequestTokenId(req),
    );

    if (!selectedToken || effectiveTokenId === null) {
      res.status(400).json({ message: "Токен бота не найден для этого проекта" });
      return;
    }

    const users = await storage.getUsersForBroadcast(projectId, effectiveTokenId, filters);

    res.json({
      count: users.length,
      sample: users.slice(0, 3),
      total: users.length,
      perBot: [{ tokenId: effectiveTokenId, count: users.length }],
      overlapEstimate: 0,
    });
  } catch (error) {
    console.error("[previewAudienceHandler] Ошибка:", error);
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
}

/**
 * Считает аудиторию по каждому боту и отвечает суммой с оценкой пересечения
 * @param res - Объект ответа
 * @param projectId - ID проекта
 * @param tokenIds - ID токенов ботов
 * @param filters - Фильтры аудитории
 * @returns void
 */
async function respondMultiBotPreview(
  res: Response,
  projectId: number,
  tokenIds: number[],
  filters: BroadcastFilters,
): Promise<void> {
  const audiences: TokenAudience[] = [];
  let sample: unknown[] = [];

  for (const tokenId of tokenIds) {
    const users = await storage.getUsersForBroadcast(projectId, tokenId, filters);
    audiences.push({ tokenId, userIds: users.map((user) => String(user.userId)) });
    if (sample.length < 3) sample = sample.concat(users.slice(0, 3 - sample.length));
  }

  const estimate = estimateAudienceOverlap(audiences);

  res.json({
    count: estimate.total,
    sample,
    total: estimate.total,
    uniqueCount: estimate.uniqueCount,
    perBot: estimate.perBot,
    overlapEstimate: estimate.overlapEstimate,
  });
}
