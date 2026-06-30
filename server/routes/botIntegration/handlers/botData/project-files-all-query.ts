/**
 * @fileoverview Объединённая выдача файлов категории «all»: uploaded ∪
 * incoming ∪ outgoing (Req 5.2). Источники сообщений исключаются, если
 * заданы uploaded-эксклюзивные фильтры (хранилище/размер/сотрудник/обложка).
 * @module botIntegration/handlers/botData/project-files-all-query
 */

import { queryUploadedFiles, type UploadedFileDTO } from "./project-files-uploaded-query";
import { queryMessageFiles, type MessageFileDTO } from "./project-files-messages-query";
import { hasUploadedOnlyFilters, type UploadedFileFilters } from "./project-files-types";

/** Элемент объединённой выдачи */
export type AnyFileDTO = UploadedFileDTO | MessageFileDTO;

/**
 * Возвращает время создания в миллисекундах для сортировки (null → 0).
 * @param value - Дата создания записи
 */
function toTime(value: Date | null): number {
  return value ? new Date(value).getTime() : 0;
}

/**
 * Собирает объединённую страницу из трёх источников. Каждый источник
 * запрашивается до offset+limit записей, результат сортируется по дате
 * убыванию и нарезается под текущую страницу; total — сумма источников.
 * @param projectId - ID проекта
 * @param filters - Разобранные фильтры
 * @param tokenId - Фильтр по токену бота (для сообщений)
 * @param limit - Размер страницы
 * @param offset - Смещение страницы
 * @returns Файлы текущей страницы и общее число записей
 */
export async function queryAllFiles(
  projectId: number,
  filters: UploadedFileFilters,
  tokenId: number | undefined,
  limit: number,
  offset: number,
): Promise<{ files: AnyFileDTO[]; total: number }> {
  const fetchCount = offset + limit;
  const includeMessages = !hasUploadedOnlyFilters(filters);

  const uploadedPromise = queryUploadedFiles(projectId, filters, fetchCount, 0);
  const incomingPromise = includeMessages
    ? queryMessageFiles(projectId, "incoming", filters.mediaType, tokenId, filters.dateFrom, filters.dateTo, fetchCount, 0)
    : Promise.resolve({ files: [] as MessageFileDTO[], total: 0 });
  const outgoingPromise = includeMessages
    ? queryMessageFiles(projectId, "outgoing", filters.mediaType, tokenId, filters.dateFrom, filters.dateTo, fetchCount, 0)
    : Promise.resolve({ files: [] as MessageFileDTO[], total: 0 });

  const [uploaded, incoming, outgoing] = await Promise.all([uploadedPromise, incomingPromise, outgoingPromise]);

  const merged: AnyFileDTO[] = [...uploaded.files, ...incoming.files, ...outgoing.files];
  merged.sort((a, b) => toTime(b.createdAt) - toTime(a.createdAt));

  return {
    files: merged.slice(offset, offset + limit),
    total: uploaded.total + incoming.total + outgoing.total,
  };
}
