/**
 * @fileoverview Маршрут DELETE /api/projects/:id
 * Доступ: requireApiAuth + requireProjectAccess (как у остальных project-роутов).
 * @module setupDeleteProjectRoute
 */

import type { Express } from "express";
import { requireProjectAccess } from "../middleware/requireProjectAccess";
import { deleteProject } from "./projectManagement/utils/projectDeleter";
import { storage } from "../storages/storage";
import { broadcastProjectsChangedToUsers } from "../terminal/broadcastProjectsChanged";
import { getProjectMemberIds } from "../terminal/resolveProjectMembers";

/**
 * Регистрирует удаление проекта с ACL через requireProjectAccess.
 * @param app - Express-приложение
 * @param requireDbReady - Middleware готовности БД
 * @returns void
 */
export function setupDeleteProjectRoute(
  app: Express,
  requireDbReady: (_req: any, res: any, next: any) => any,
): void {
  app.delete(
    "/api/projects/:id",
    requireDbReady,
    requireProjectAccess,
    async (req, res) => {
      try {
        const id = parseInt(req.params.id, 10);
        console.log(`🗑️ Начинаем удаление проекта ${id}`);

        const project = await storage.getBotProject(id);
        if (!project) {
          console.log(`❌ Проект ${id} не найден`);
          return res.status(404).json({ message: "Проект не найден" });
        }
        console.log(`✅ Проект ${id} найден: ${project.name}`);

        // Члены для live-события — до удаления (collaborators каскадом уйдут).
        const members = await getProjectMemberIds(id, project.ownerId ?? null);

        const result = await deleteProject(id);
        if (!result.success) {
          return res.status(500).json({ message: result.message });
        }

        console.log(`🎉 Проект ${id} успешно удален`);

        try {
          broadcastProjectsChangedToUsers(members, "deleted");
        } catch (err) {
          console.error(
            `[setupDeleteProjectRoute] Ошибка broadcast projects-changed для проекта ${id}:`,
            err,
          );
        }

        return res.json({ message: result.message });
      } catch (error) {
        console.error("❌ Критическая ошибка удаления проекта:", error);
        return res.status(500).json({
          message: "Не удалось удалить проект",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );
}
