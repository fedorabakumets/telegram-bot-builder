/**
 * @fileoverview Хендлер очистки "мёртвых" папок ботов
 * Удаляет папки из bots/, для которых нет соответствующего проекта в БД
 * @module projectManagement/handlers/cleanupOrphanedFoldersHandler
 */

import type { Request, Response } from "express";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { storage } from "../../../storages/storage";

/**
 * Извлекает projectId из имени папки бота
 * Поддерживает форматы: bot_{projectId}_{tokenId} и {name}_{projectId}_{tokenId}
 * @param folderName - Имя папки
 * @returns projectId или null если не удалось распарсить
 */
function extractProjectId(folderName: string): number | null {
  // Формат: что-то_<число>_<число> — берём предпоследний сегмент
  const parts = folderName.split('_');
  if (parts.length < 3) return null;

  const tokenId = parseInt(parts[parts.length - 1]);
  const projectId = parseInt(parts[parts.length - 2]);

  if (isNaN(projectId) || isNaN(tokenId)) return null;
  return projectId;
}

/**
 * Обрабатывает запрос на очистку папок ботов без проекта в БД
 * @param req - Объект запроса
 * @param res - Объект ответа
 * @returns Список удалённых папок и количество
 */
export async function cleanupOrphanedFoldersHandler(req: Request, res: Response): Promise<void> {
  try {
    const botsDir = join(process.cwd(), 'bots');

    if (!existsSync(botsDir)) {
      res.json({ deleted: [], count: 0, message: "Директория bots не существует" });
      return;
    }

    // Получаем все проекты из БД
    const allProjects = await storage.getAllBotProjects();
    const existingIds = new Set(allProjects.map(p => p.id));

    const allEntries = readdirSync(botsDir, { withFileTypes: true });
    const botDirs = allEntries.filter(e => e.isDirectory());

    const deleted: string[] = [];
    const skipped: string[] = [];

    const fs = await import('fs');

    for (const dir of botDirs) {
      const projectId = extractProjectId(dir.name);

      if (projectId === null) {
        skipped.push(dir.name);
        continue;
      }

      if (!existingIds.has(projectId)) {
        const dirPath = join(botsDir, dir.name);
        try {
          await fs.promises.rm(dirPath, { recursive: true, force: true });
          deleted.push(dir.name);
          console.log(`🗑️ Удалена осиротевшая папка: ${dir.name} (projectId=${projectId})`);
        } catch (err) {
          console.error(`❌ Ошибка удаления ${dir.name}:`, err);
        }
      }
    }

    console.log(`✅ Очистка завершена: удалено ${deleted.length} папок`);
    res.json({ deleted, skipped, count: deleted.length, message: `Удалено ${deleted.length} папок` });
  } catch (error) {
    console.error("❌ Ошибка очистки папок:", error);
    res.status(500).json({ message: "Ошибка при очистке папок" });
  }
}
