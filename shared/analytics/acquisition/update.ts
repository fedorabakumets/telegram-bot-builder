/** @fileoverview Чистые общие контракты рекламной аналитики без импортов выполнения и базы. */
import { z } from 'zod';
import { day, money, rate } from './validation';
/** Поля размещения, изменение которых не переписывает источник опубликованных ссылок. */
export const placementPatch = z.object({
  /** Новое имя. */ name: z.string().trim().min(1).max(200).optional(),
  /** Начало размещения. */ startsOn: day.nullable().optional(),
  /** Конец размещения. */ endsOn: day.nullable().optional(),
  /** Архивирование или восстановление. */ archived: z.boolean().optional(),
}).strict();
/** Разрешённая корректировка одной дневной оплаты. */
export const expensePatch = z.object({
  /** Исходная сумма. */ amount: money.optional(),
  /** Исходная валюта. */ currency: z.enum(['RUB','USD']).optional(),
  /** Учётный день. */ day: day.optional(),
  /** Ручной курс. */ exchangeRateRubPerUsd: rate.nullable().optional(),
  /** Дата фиксации ручного курса. */ exchangeRateDate: day.nullable().optional(),
  /** Пояснение. */ note: z.string().trim().max(2000).optional(),
  /** Отмена записи с сохранением истории. */ archived: z.boolean().optional(),
}).strict();
