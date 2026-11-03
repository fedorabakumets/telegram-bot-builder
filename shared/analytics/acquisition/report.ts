/** @fileoverview Чистые общие контракты рекламной аналитики без импортов выполнения и базы. */
import { z } from 'zod';
import { timezone } from './validation';
/** Параметры отчёта; без дат показывается весь срок размещений. */
export const reportInput = z.object({
  /** Включить автоматически найденные источники без размещений. */ includeSources: z.enum(['true','false']).optional(),
  /** Бот либо весь проект. */ tokenId: z.coerce.number().int().positive().optional(),
  /** Включённая граница. */ from: z.string().datetime({ offset: true }).optional(),
  /** Исключённая граница. */ to: z.string().datetime({ offset: true }).optional(),
  /** Пояс отображения. */ timezone: timezone.default('Europe/Moscow'),
  /** Валюта ручного пересчёта. */ currency: z.enum(['RUB','USD']).default('RUB'),
  /** Размещение для подробного отчёта. */ placementId: z.coerce.number().int().positive().optional(),
}).strict();
