/** @fileoverview Общий машиночитаемый результат MCP с явным состоянием и честно неоднородным payload. */
import { z } from 'zod';

/** Метаданные выполнения независимо от формы бизнес-данных конкретного действия. */
export const actionExecutionSchema = z.object({
  /** Проверенный раздел каталога. */
  section: z.string(),
  /** Назначенный эффект. */
  effect: z.enum(['read', 'prepare', 'write', 'file', 'external', 'unknown']),
  /** Разрушительность действия. */
  destructive: z.boolean(),
  /** Применение настроек к работающему боту проверяется отдельно. */
  runtimeApply: z.enum(['not_applicable', 'separate']),
  /** Фоновые операции требуют отдельного наблюдения. */
  completionMode: z.enum(['immediate', 'job']),
  /** Имя инструмента проверки фонового результата. */
  pollAction: z.string().optional(),
  /** Итог, включая неподтверждённый или неизвестный исход. */
  outcome: z.enum(['prepared', 'read', 'saved', 'pending', 'partial', 'unknown', 'error', 'unverified', 'file_result']),
  /** Подтверждение хранения, не подтверждение доставки интерфейсу. */
  persistence: z.object({ confirmed: z.boolean(), projectId: z.number().int().positive().optional(),
    revision: z.number().int().nonnegative().optional() }),
  /** Дополнительные статусы сервера без объявления их успешными по умолчанию. */
  sideEffects: z.record(z.unknown()).optional(),
});

/** Общая оболочка: точная схема execution и исходный неоднородный payload. */
export const actionOutputSchema = z.object({
  /** Данные исходного обработчика, для которых точная бизнес-схема описывается отдельно. */
  data: z.unknown().nullable(),
  /** Точное состояние выполнения. */
  execution: actionExecutionSchema,
});
