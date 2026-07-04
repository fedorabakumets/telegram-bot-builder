/**
 * @fileoverview Помощники корректного скачивания файлов таблицы хранилища.
 * Резолвят ссылку скачивания для всех случаев, включая файлы, представленные
 * только как file_id без локального объекта (Req 15.4): для таких файлов
 * строится прокси-URL `/api/projects/:id/telegram-file` по доступному file_id и
 * токену (приоритет выбранного токена), а при невозможности резолва ссылка не
 * формируется — чтобы не было битой ссылки. Вынесено отдельным файлом, чтобы
 * files-table-utils оставался ≤150 строк.
 * @module components/editor/files/panel/table/file-download
 */

import type { ProjectFile } from '../../hooks/use-project-files';

/** Пара file_id и токена для построения прокси-ссылки Telegram */
interface ResolvedFileId {
  /** Telegram file_id */
  fileId: string;
  /** ID токена бота (если известен) */
  tokenId?: number | null;
}

/**
 * Извлекает `fileIdsByToken` из JSON-записи url (`{"__type":"file_id",...}`).
 * @param url - Значение url файла
 * @returns Карта tokenId → file_id или null, если это не JSON-запись file_id
 */
function parseFileIdJson(url: string | null | undefined): Record<string, string> | null {
  if (!url || !url.startsWith('{')) return null;
  try {
    const parsed = JSON.parse(url) as { __type?: string; fileIdsByToken?: Record<string, string> };
    if (parsed.__type === 'file_id' && parsed.fileIdsByToken) return parsed.fileIdsByToken;
  } catch {
    return null;
  }
  return null;
}

/**
 * Выбирает file_id и токен из карты с приоритетом выбранного токена.
 * @param byToken - Карта tokenId → file_id
 * @param selectedTokenId - Выбранный токен бота
 * @returns Пара file_id/токен или null, если карта пуста
 */
function pickFromMap(byToken: Record<string, string>, selectedTokenId?: number | null): ResolvedFileId | null {
  const keys = Object.keys(byToken);
  if (keys.length === 0) return null;
  const preferred = selectedTokenId != null && byToken[String(selectedTokenId)] ? String(selectedTokenId) : keys[0];
  return { fileId: byToken[preferred], tokenId: Number(preferred) };
}

/**
 * Резолвит file_id и токен файла из всех доступных источников: карта
 * `fileIdsByToken`, JSON-запись `url`, одиночные `fileId`/`tokenId`.
 * @param file - Запись файла проекта
 * @param selectedTokenId - Выбранный токен бота (приоритет)
 * @returns Пара file_id/токен или null
 */
function resolveFileId(file: ProjectFile, selectedTokenId?: number | null): ResolvedFileId | null {
  if (file.fileIdsByToken && Object.keys(file.fileIdsByToken).length > 0) {
    const map: Record<string, string> = {};
    for (const [key, value] of Object.entries(file.fileIdsByToken)) map[String(key)] = value;
    const picked = pickFromMap(map, selectedTokenId);
    if (picked) return picked;
  }
  const fromJson = parseFileIdJson(file.url);
  if (fromJson) {
    const picked = pickFromMap(fromJson, selectedTokenId);
    if (picked) return picked;
  }
  if (file.fileId) return { fileId: file.fileId, tokenId: file.tokenId ?? selectedTokenId ?? null };
  return null;
}

/**
 * Определяет, представлен ли файл только как file_id (без локального объекта).
 * @param file - Запись файла проекта
 * @returns true, если url отсутствует или является JSON-записью file_id
 */
export function isFileIdOnly(file: ProjectFile): boolean {
  const url = file.url?.trim();
  return !url || url.startsWith('{');
}

/**
 * Строит ссылку скачивания файла. Для локального объекта возвращает прямой url;
 * для file_id-only — прокси-URL по резолвнутому file_id и токену с именем файла.
 * Возвращает null, если ссылку построить нельзя (чтобы не было битой ссылки).
 * @param file - Запись файла проекта
 * @param projectId - ID проекта (для прокси-эндпоинта)
 * @param selectedTokenId - Выбранный токен бота (приоритет file_id)
 * @returns URL скачивания или null
 */
export function getDownloadHref(
  file: ProjectFile,
  projectId: number,
  selectedTokenId?: number | null,
): string | null {
  const url = file.url?.trim();
  if (url && !url.startsWith('{')) return url;

  const resolved = resolveFileId(file, selectedTokenId);
  if (!resolved) return null;

  const params = new URLSearchParams({ fileId: resolved.fileId });
  if (resolved.tokenId != null) params.set('tokenId', String(resolved.tokenId));
  if (file.fileName) params.set('fileName', file.fileName);
  return `/api/projects/${projectId}/telegram-file?${params.toString()}`;
}
