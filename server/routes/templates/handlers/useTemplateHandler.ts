/**
 * @fileoverview POST /api/templates/:id/use — без IDOR; копия с ownerId = caller.
 * @module server/routes/templates/handlers/useTemplateHandler
 */

import { durableAction } from "../../../services/action-requests/durable-action";
import { actionRequestLedger } from "../../../services/action-requests/default-ledger";
import { externalActionReceipt } from "../../durable-project-action";
import type { Request, Response } from "express";

import { storage } from "../../../storages/storage";
import {
  assertOwnerId,
  canViewOrUseTemplate,
  parseTemplateId,
} from "../template-access";

/**
 * Создаёт проект и private-копию шаблона для текущего пользователя.
 * @param req - Запрос Express
 * @param res - Ответ Express
 * @returns Promise<void>
 */
export async function useTemplateHandler(req: Request, res: Response): Promise<void> {
  try {
    const ownerId = assertOwnerId(req, res);
    if (ownerId === null) return;

    const id = parseTemplateId(req.params.id, res);
    if (id === null) return;

    const template = await storage.getBotTemplate(id);
    if (!template) {
      res.status(404).json({ message: "Template not found" });
      return;
    }

    if (!canViewOrUseTemplate(template, ownerId)) {
      res.status(403).json({ message: "You don't have permission to use this template" });
      return;
    }

    await durableAction(async () => {
    await storage.incrementTemplateUseCount(id);

    const newProject = await storage.createBotProject({
      name: template.name,
      description: template.description ?? undefined,
      data: template.data as Record<string, unknown>,
      ownerId,
      userDatabaseEnabled: 1,
    });

    /** Частичный результат фиксируется до следующего неатомарного шага. */
    if (res.locals.actionRequestCheckpoint) await res.locals.actionRequestCheckpoint({ projectId: newProject.id });
    const copiedTemplate = await storage.createBotTemplate({
      name: template.name,
      description: template.description,
      category: "custom",
      data: template.data as Record<string, unknown>,
      ownerId,
      tags: template.tags,
      isPublic: 0,
      difficulty: (template.difficulty || "easy") as "easy" | "medium" | "hard",
      language: (template.language || "ru") as
        | "ru"
        | "en"
        | "es"
        | "fr"
        | "de"
        | "it"
        | "pt"
        | "zh"
        | "ja"
        | "ko",
      complexity: template.complexity || 1,
      estimatedTime: template.estimatedTime || 5,
      featured: 0,
    });

    res.json({
      message: "Template copied to your projects and collection",
      project: newProject,
      copiedTemplate,
    });
    }, { action: 'use_template', scope: () => `owner:${ownerId}:template:${id}`, ledger: actionRequestLedger, receipt: externalActionReceipt })(req, res, () => undefined);

  } catch (error) {
    console.error("Template use error:", error);
    res.status(500).json({ message: "Failed to use template" });
  }
}
