/** @fileoverview Потоковый локальный экспорт логов из авторизованного API. */
import { mkdir, open, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { searchBotLogsInDb, validateLogSearch, type BotLogSearchOptions } from './bot-log-search-db.ts';

/** Параметры ограниченного экспорта. */
export interface BotLogExportOptions extends Omit<BotLogSearchOptions, 'limit'> {
  /** Формат файла. */
  format?: 'txt' | 'jsonl';
  /** Максимальное число экспортируемых строк, до 5000. */
  maxRows?: number;
}
/** Сохраняет строки в отдельном файле, не принимая произвольного пути.
 * @param projectId - Проект
 * @param tokenId - Бот
 * @param options - Период, фильтры и ограничения
 * @returns Путь и статистика либо ошибка; порядок по убыванию идентификатора
 */
export async function exportBotLogsInDb(projectId: number, tokenId: number, options: BotLogExportOptions) {
  const format = options.format ?? 'jsonl';
  const maxRows = options.maxRows ?? 1000;
  const invalid = validateLogSearch(projectId, tokenId, options);
  if (invalid) return { error: invalid };
  if (!['txt', 'jsonl'].includes(format) || !Number.isSafeInteger(maxRows) || maxRows < 1 || maxRows > 5000) return { error: 'Формат txt/jsonl; maxRows от 1 до 5000' };
  const directory = join(tmpdir(), 'telegram-bot-builder', 'mcp-log-exports');
  const path = join(directory, `project-${projectId}-bot-${tokenId}-${randomUUID()}.${format}`);
  let file: Awaited<ReturnType<typeof open>> | undefined;
  let count = 0, scanned = 0, bytes = 0, truncated = false;
  let cursor = options.beforeId;
  try {
    await mkdir(directory, { recursive: true, mode: 0o700 });
    file = await open(path, 'wx', 0o600);
    while (count < maxRows && scanned < 10000) {
      const page = await searchBotLogsInDb(projectId, tokenId, { ...options, limit: Math.min(1000, maxRows - count), beforeId: cursor });
      if ('error' in page) throw new Error('Ошибка API');
      scanned += page.scanned;
      for (const log of page.logs) {
        const line = format === 'jsonl' ? `${JSON.stringify(log)}\n` : `[${log.timestamp ?? ''}] ${log.type} #${log.id} ${log.content}\n`;
        const size = Buffer.byteLength(line);
        if (bytes + size > 10 * 1024 * 1024) { truncated = true; cursor = log.id + 1; break; }
        await file.write(line);
        bytes += size;
        count++;
      }
      if (truncated) break;
      cursor = page.nextBeforeId ?? undefined;
      if (!page.hasMore) break;
      if (count >= maxRows || scanned >= 10000) truncated = true;
    }
    await file.close();
    return { path, count, scanned, bytes, format, truncated, nextBeforeId: truncated ? cursor ?? null : null, order: 'id_desc' as const, retentionLimited: true as const };
  } catch {
    await file?.close().catch(() => undefined);
    await unlink(path).catch(() => undefined);
    return { error: 'Экспорт не завершён; неполный файл удалён' };
  }
}
