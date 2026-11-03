/** @fileoverview Общие контракты отправки и изменения сообщений диалогов. */
import { z } from 'zod';
import { remoteMediaReferenceSchema, httpMediaReferenceSchema } from './media-reference-contracts';
import { sendMessageSchema } from './tables/additional-schemas';
import { buttonSchema } from './tables/button-schema';
/** Сообщение с медиа и кнопками; не принимает локальные серверные пути файлов. */
export const dialogMessageBodySchema = sendMessageSchema.extend({
  /** Ссылки на медиа. */
  mediaUrls: z.array(remoteMediaReferenceSchema).max(10).default([]),
  /** Кнопки сообщения. */
  buttons: z.array(buttonSchema).max(100).default([]),
  /** Количество кнопок в ряду. */
  buttonsPerRow: z.number().int().min(0).max(8).default(0),
});
/** Редактируемые поля сообщения. */
export const editDialogMessageBodySchema = dialogMessageBodySchema.pick({ messageText: true, buttons: true, buttonsPerRow: true });

/** HTTP поддерживает проверяемые активы проекта; удалённый MCP путей не принимает. */
export const httpDialogMessageBodySchema = dialogMessageBodySchema.extend({ mediaUrls: z.array(httpMediaReferenceSchema).max(10).default([]) });
