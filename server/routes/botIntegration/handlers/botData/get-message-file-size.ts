/** @fileoverview Уточнение отсутствующего размера старого медиа через Telegram getFile с кэшированием в истории. */
import type { Request, Response } from 'express';
import { and, eq, sql } from 'drizzle-orm';
import { botMessages } from '@shared/schema';
import { db } from '../../../../database/db';
import { resolveProjectBotToken } from '../../../utils/resolve-request-token';
import { resolveDevMediaToken } from './dev-media-token';
import { fetchWithProxy } from '../../../../utils/telegram-proxy';
import { MEDIA_TYPES } from './project-files-types';

/**
 * Возвращает известный размер либо получает его по file_id и сохраняет в том же сообщении.
 * @param req - Проверенный проект и внутренний ID сообщения
 * @param res - Размер файла или объяснение недоступности
 */
export async function getMessageFileSize(req: Request, res: Response): Promise<void> {
  try {
    const projectId = Number(req.params.projectId);
    const messageId = Number(req.params.messageId);
    if (!Number.isSafeInteger(projectId) || !Number.isSafeInteger(messageId)) { res.status(400).json({ message: 'Неверный ID' }); return; }
    const [message] = await db.select().from(botMessages).where(and(eq(botMessages.id, messageId), eq(botMessages.projectId, projectId))).limit(1);
    if (!message) { res.status(404).json({ message: 'Сообщение не найдено' }); return; }
    const data = message.messageData as Record<string, { file_id?: string; file_size?: number }> | null;
    const type = MEDIA_TYPES.find(kind => data?.[kind]?.file_id);
    const media = type ? data?.[type] : null;
    if (!type || !media?.file_id) { res.json({ fileSize: null }); return; }
    if (typeof media.file_size === 'number' && media.file_size > 0) { res.json({ fileSize: media.file_size }); return; }
    const bot = await resolveProjectBotToken(projectId, message.tokenId);
    if (!bot || bot.id !== message.tokenId) { res.status(404).json({ message: 'Бот сообщения не найден' }); return; }
    const token = await resolveDevMediaToken(projectId, bot.id) ?? bot.token;
    const response = await fetchWithProxy(`https://api.telegram.org/bot${token}/getFile`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_id: media.file_id }), signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) { res.json({ fileSize: null }); return; }
    const result = await response.json();
    const size = result.ok ? result.result?.file_size : null;
    if (!Number.isSafeInteger(size) || size <= 0) { res.json({ fileSize: null }); return; }
    /** Меняется только размер выбранного медиа, остальные поля сообщения остаются прежними. */
    const fieldPath = `{${type},file_size}`;
    await db.update(botMessages).set({ messageData: sql`jsonb_set(${botMessages.messageData}, ${fieldPath}::text[], ${JSON.stringify(size)}::jsonb, true)` })
      .where(and(eq(botMessages.id, messageId), eq(botMessages.projectId, projectId), eq(botMessages.tokenId, bot.id), sql`${botMessages.messageData}->${type}->>'file_id' = ${media.file_id}`));
    res.json({ fileSize: size });
  } catch (error) {
    const failure = error as { name?: string; code?: string; cause?: { code?: string; message?: string } };
    console.warn("[Telegram file size]", failure.name, failure.code ?? failure.cause?.code ?? "request_failed");
    res.status(503).json({ message: 'Telegram временно не вернул размер файла' });
  }
}
