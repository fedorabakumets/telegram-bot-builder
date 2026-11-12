/** @fileoverview Строгая проверка ограничений поиска и пагинации административного списка ботов. */
import { z } from 'zod';

/** Допустимые параметры с ограничением размера ответа и глубины смещения. */
const querySchema = z.object({
  search: z.string().trim().max(100).default(''),
  /** Отбирает включённых ботов, включая спящих и ожидающих запуска. */
  activity: z.enum(['enabled', 'all']).default('enabled'),
  mode: z.enum(['all', 'direct', 'ondemand', 'process']).default('all'),
  page: z.union([z.string(), z.number()]).pipe(z.coerce.number().int().min(1).max(100_000)).default(1),
  pageSize: z.union([z.string(), z.number()]).pipe(z.coerce.number().int().min(1).max(100)).default(25),
});

/** Проверенные параметры одной страницы. */
export type WorkerBotListQuery = z.infer<typeof querySchema>;

/** Отклоняет неоднозначные массивы и чрезмерные запросы до обращения к базе. */
export function parseWorkerBotQuery(value: unknown) { return querySchema.safeParse(value); }
