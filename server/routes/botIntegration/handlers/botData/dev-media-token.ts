/** @fileoverview Изолированные токены для чтения Telegram-медиа в локальной копии базы. */
import { readFile } from 'node:fs/promises';

/** Запись приватного локального файла, не используемая для запуска ботов. */
interface MediaTokenEntry {
  /** Идентификатор токена в дампе. */
  id: number;
  /** Проект владельца токена. */
  project_id: number;
  /** Токен для getFile и чтения CDN. */
  token: string;
}

/**
 * Читает отдельный токен только для обработчика медиа в режиме разработки.
 * @param projectId - Проверенный проект из маршрута
 * @param tokenId - Токен, уже разрешённый штатным обработчиком
 * @returns Токен чтения либо null для обычного пути
 */
export async function resolveDevMediaToken(projectId: number, tokenId: number): Promise<string | null> {
  const file = process.env.DEV_TELEGRAM_MEDIA_TOKENS_FILE;
  if (process.env.NODE_ENV !== 'development' || !file) return null;
  const rows: MediaTokenEntry[] = JSON.parse((await readFile(file, 'utf8')).replace(/^\uFEFF/, ''));
  const entry = rows.find(row => row.id === tokenId && row.project_id === projectId);
  return entry?.token && /^\d+:[\w-]+$/.test(entry.token) ? entry.token : null;
}
