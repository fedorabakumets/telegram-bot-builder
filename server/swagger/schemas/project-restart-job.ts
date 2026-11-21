/** @fileoverview Контракт принятого фонового массового перезапуска и его прогресса. */
import { z } from 'zod';
import { ProjectBotRestartAllOkSchema } from './project-bot';

/** Завершённая попытка одного токена без секретов. */
const tokenResult = z.object({ tokenId: z.number().int(), success: z.boolean(),
  processId: z.string().optional(), error: z.string().optional() });

/** Снимок принимаемого задания и ответа последующего опроса. */
export const ProjectRestartJobSchema = z.object({
  /** Идентификатор для опроса в пределах проекта. */
  jobId: z.string().uuid(),
  /** Проект задания. */
  projectId: z.number().int(),
  /** Завершение проверяется по статусу, а не по успешному принятию POST. */
  status: z.enum(['queued', 'running', 'completed', 'failed']),
  /** Подтверждённый этап и счётчики. */
  progress: z.object({
    phase: z.enum(['queued', 'stopping', 'cooldown', 'starting', 'completed']),
    total: z.number().int(), completed: z.number().int(), stopped: z.number().int(), stopFailed: z.number().int(),
    attempted: z.number().int(), restarted: z.number().int(), failed: z.number().int(),
    results: z.array(tokenResult),
  }),
  /** Время принятия задания. */
  createdAt: z.string().datetime(),
  /** Время последнего изменения. */
  updatedAt: z.string().datetime(),
  /** Окончательный результат, включая частичные ошибки. */
  result: ProjectBotRestartAllOkSchema.extend({ ok: z.boolean(), failed: z.number().int() }).optional(),
  /** Безопасное объяснение неудачи задания. */
  error: z.string().optional(),
}).openapi('ProjectRestartJob');
