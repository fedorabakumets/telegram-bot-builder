/** @fileoverview Публичные ответы задач проверки доступа, без токенов и текста Telegram. */
import './common';
import { z } from 'zod';
/** Карточка mapChatAccessCheckJob. */
export const ChatAccessJobSchema = z.object({
  /** Задача. */ jobId: z.number(), /** Проект. */ projectId: z.number(), /** Бот. */ tokenId: z.number(),
  /** Состояние. */ status: z.enum(['pending', 'running', 'cancelling', 'cancelled', 'completed', 'failed']),
  /** Очередь. */ totalCount: z.number(), /** Проверено. */ processedCount: z.number(),
  /** Доступны. */ availableCount: z.number(), /** Заблокированы. */ kickedCount: z.number(),
  /** Удалены. */ deletedCount: z.number(), /** Ошибки. */ errorCount: z.number(),
  /** Начало. */ startedAt: z.string().nullable(), /** Окончание. */ finishedAt: z.string().nullable(),
}).openapi('ChatAccessJob');
/** Состояние сохранённой проверки чата. */
export const ChatAccessOutcomeSchema = z.object({
  /** Сохранённая классификация. */ accessStatus: z.enum(['available', 'kicked', 'error']),
  /** Время проверки UTC. */ accessCheckedAt: z.string(),
});
