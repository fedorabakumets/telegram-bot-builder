/**
 * @fileoverview Хендлер выдачи файлов проекта (GET /api/projects/:projectId/files).
 * Поддерживает категории (all/incoming/outgoing/uploaded), расширенные фильтры
 * и обогащённые поля выдачи. Разбор/валидация и запросы вынесены в
 * project-files-*; добавление и удаление — в отдельные хендлеры.
 * @module botIntegration/handlers/botData/getProjectFilesHandler
 */

import type { Request, Response } from "express";

import { parseProjectFilesQuery } from "./project-files-query-parse";
import { queryUploadedFiles } from "./project-files-uploaded-query";
import { queryMessageFiles } from "./project-files-messages-query";
import { queryAllFiles } from "./project-files-all-query";

// Реэкспорт для обратной совместимости импортов в setupBotIntegrationRoutes
export { addProjectFileHandler } from "./addProjectFileHandler";
export { deleteProjectFilesHandler } from "./deleteProjectFilesHandler";

/**
 * Возвращает список файлов проекта с пагинацией и фильтрацией.
 *
 * @route GET /api/projects/:projectId/files
 * Query: category|source, fileName, dateFrom, dateTo, mediaType|type,
 *        uploadedBy, sizeMin, sizeMax, storageConfigId, tokenId, page, limit
 * @param req - Запрос с projectId в params и query-параметрами фильтрации
 * @param res - Ответ со списком файлов и метаданными пагинации
 */
export async function getProjectFilesHandler(req: Request, res: Response): Promise<void> {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    if (isNaN(projectId)) {
      res.status(400).json({ message: "Неверный projectId" });
      return;
    }

    const parsed = parseProjectFilesQuery(req);
    if (!parsed.ok) {
      res.status(400).json({ message: parsed.error });
      return;
    }

    const { category, tokenId, filters, page, limit, offset } = parsed.value;

    if (category === "uploaded") {
      const result = await queryUploadedFiles(projectId, filters, limit, offset);
      res.json({ files: result.files, total: result.total, page, limit });
      return;
    }

    if (category === "all") {
      const result = await queryAllFiles(projectId, filters, tokenId, limit, offset);
      res.json({ files: result.files, total: result.total, page, limit });
      return;
    }

    // incoming | outgoing
    const result = await queryMessageFiles(
      projectId,
      category,
      filters.mediaType,
      tokenId,
      filters.dateFrom,
      filters.dateTo,
      limit,
      offset,
    );
    res.json({ files: result.files, total: result.total, page, limit });
  } catch (error) {
    console.error("Ошибка получения файлов проекта:", error);
    res.status(500).json({ message: "Не удалось получить файлы проекта" });
  }
}
