/**
 * @fileoverview Сохранение проекта с атомарной проверкой ревизии и квитанцией результата.
 */
import type { Request, Response } from "express";
import { updateBotProjectSchema, privilegedProjectFields } from "@shared/schema/project-update";
import { z } from "zod";
import { storage } from "../../../storages/storage";
import type { StorageBotProjectUpdate } from "../../../storages/storageTypes";
import { runProjectUpdateEffects } from "./project-update-effects";
/**
 * Сохраняет строку проекта и независимо сообщает результаты сопутствующих действий.
 * Старые клиенты без expectedRevision сохраняют прежний режим перезаписи.
 * @param req - Авторизованный запрос
 * @param res - HTTP ответ
 * @returns Завершение обработки запроса
 */
export async function updateProjectHandler(req: Request, res: Response): Promise<void> {
 try {
  const projectId = Number(req.params.id);
  if (!Number.isSafeInteger(projectId) || projectId < 1) { res.status(400).json({ message: "Неверный ID проекта" }); return; }
  if (privilegedProjectFields.some((field) => Object.prototype.hasOwnProperty.call(req.body ?? {}, field))) {
   res.status(400).json({ code: "PROJECT_FIELD_NOT_ALLOWED", message: "Поле недоступно в общем маршруте изменения проекта" }); return;
  }
  const expectedRevision = z.number().int().nonnegative().optional().parse(req.body?.expectedRevision);
  // Устаревшие admin-клиенты получают атомарную защиту через перевод timestamp в revision.
  let revision = expectedRevision;
  if (revision === undefined && req.isAdminRequest && req.body?.expectedUpdatedAt !== undefined) {
   const expectedDate = z.string().datetime().parse(req.body.expectedUpdatedAt);
   const current = await storage.getBotProject(projectId);
   if (!current) { res.status(404).json({ message: "Проект не найден" }); return; }
   if (new Date(current.updatedAt!).getTime() !== Date.parse(expectedDate)) {
    res.status(409).json({ code: "PROJECT_CONFLICT", message: "Проект изменился", revision: current.revision }); return;
   }
   revision = current.revision;
  }
  const validatedData = updateBotProjectSchema.parse(req.body) as StorageBotProjectUpdate;
  const commitMessage = typeof req.body?.commitMessage === "string" ? req.body.commitMessage.trim() : "";
  const project = await storage.updateBotProject(projectId, validatedData, revision);
  if (!project) {
   const current = await storage.getBotProject(projectId);
   res.status(current && revision !== undefined ? 409 : 404).json({
    code: current && revision !== undefined ? "PROJECT_CONFLICT" : "PROJECT_NOT_FOUND",
    message: current ? "Проект изменился. Перечитайте его перед сохранением." : "Проект не найден",
    ...(current ? { revision: current.revision, updatedAt: current.updatedAt } : {}),
   }); return;
  }
  // После commit ошибка уведомления не должна выдавать ложный отказ сохранения.
  let sideEffects: Record<string, unknown>;
  try { sideEffects = await runProjectUpdateEffects(req, project, validatedData, commitMessage); }
  catch { sideEffects = { warning: "Не удалось завершить сопутствующие действия; запись сохранена" }; }
  res.json({ ...project, effect: "application", outcome: "saved",
   persistence: { confirmed: true, projectId, revision: project.revision }, sideEffects });
 } catch (error) {
  if (error instanceof z.ZodError) res.status(400).json({ message: "Неверные данные", errors: error.issues });
  else res.status(500).json({ message: "Не удалось обновить проект", error: (error as Error).message });
 }
}
