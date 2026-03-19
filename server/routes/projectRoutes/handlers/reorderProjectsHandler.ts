import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";

export async function reorderProjectsHandler(req: Request, res: Response): Promise<void> {
  try {
    const { projectIds } = req.body;

    if (!Array.isArray(projectIds) || projectIds.some((id) => typeof id !== 'number')) {
      res.status(400).json({ message: 'Неверный ID проекта' });
      return;
    }

    await storage.reorderBotProjects(projectIds);
    res.json({ success: true });
  } catch (error) {
    console.error("Ошибка переупорядочивания проектов:", error);
    res.status(500).json({ message: "Не удалось переупорядочить проекты" });
  }
}
