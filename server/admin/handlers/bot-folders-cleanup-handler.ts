/**
 * @fileoverview Admin: очистка осиротевших папок в `bots/`.
 * @module server/admin/handlers/bot-folders-cleanup-handler
 */

import type { Request, Response } from "express";
import { existsSync, readdirSync } from "node:fs";
import { promises as fsPromises } from "node:fs";
import { join } from "node:path";

import { storage } from "../../storages/storage";

/**
 * Достаёт projectId из имени папки `…_{projectId}_{tokenId}`.
 * @param folderName - Имя директории в bots/
 * @returns projectId или null
 */
function extractProjectId(folderName: string): number | null {
  const parts = folderName.split("_");
  if (parts.length < 3) return null;
  const tokenId = Number.parseInt(parts[parts.length - 1], 10);
  const projectId = Number.parseInt(parts[parts.length - 2], 10);
  if (!Number.isFinite(projectId) || !Number.isFinite(tokenId)) return null;
  return projectId;
}

/**
 * POST /admin/api/bot-folders/cleanup — удаляет папки без проекта в БД.
 * @param _req - Запрос Express
 * @param res - Ответ Express
 * @returns Promise<void>
 */
export async function adminCleanupOrphanedBotFoldersHandler(
  _req: Request,
  res: Response,
): Promise<void> {
  try {
    const botsDir = join(process.cwd(), "bots");
    if (!existsSync(botsDir)) {
      res.json({
        deleted: [],
        skipped: [],
        count: 0,
        message: "Директория bots не существует",
      });
      return;
    }

    const existingIds = new Set((await storage.getAllBotProjects()).map((p) => p.id));
    const botDirs = readdirSync(botsDir, { withFileTypes: true }).filter((e) => e.isDirectory());
    const deleted: string[] = [];
    const skipped: string[] = [];

    for (const dir of botDirs) {
      const projectId = extractProjectId(dir.name);
      if (projectId === null) {
        skipped.push(dir.name);
        continue;
      }
      if (existingIds.has(projectId)) continue;

      try {
        await fsPromises.rm(join(botsDir, dir.name), { recursive: true, force: true });
        deleted.push(dir.name);
        console.log(`🗑️ Admin: удалена осиротевшая папка ${dir.name} (projectId=${projectId})`);
      } catch (err) {
        console.error(`❌ Admin: ошибка удаления ${dir.name}:`, err);
      }
    }

    res.json({
      deleted,
      skipped,
      count: deleted.length,
      message: `Удалено ${deleted.length} папок`,
    });
  } catch (error) {
    console.error("❌ Admin cleanup bot-folders:", error);
    res.status(500).json({ message: "Ошибка при очистке папок" });
  }
}
