/**
 * @fileoverview Запрос сведений о проекте для административного редактора
 * @module server/admin/handlers/admin-project-handlers
 */

import type { Request, Response } from "express";
import { storage } from "../../storages/storage";

/**
 * Возвращает проект и безопасные сведения о владельце без секретов.
 * @param req - Запрос с идентификатором проекта
 * @param res - Ответ Express
 * @returns Promise<void>
 */
export async function handleGetAdminProject(req: Request, res: Response): Promise<void> {
  const projectId = Number(req.params.id);
  if (!Number.isInteger(projectId)) {
    res.status(400).json({ message: "Неверный идентификатор проекта" });
    return;
  }

  const project = await storage.getBotProject(projectId);
  if (!project) {
    res.status(404).json({ message: "Проект не найден" });
    return;
  }

  const owner = project.ownerId ? await storage.getTelegramUser(project.ownerId) : undefined;
  res.json({
    adminMode: true,
    project,
    owner: owner ? {
      id: owner.id,
      username: owner.username,
      firstName: owner.firstName,
      lastName: owner.lastName,
    } : null,
  });
}
