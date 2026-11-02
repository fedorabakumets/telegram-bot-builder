/** @fileoverview Проверяемые исправления и архивирование рекламных объектов с сохранением идентичности ссылок. */
import { z } from 'zod';
import type { PoolClient } from 'pg';
import { sourceInput, day, money, rate, AcquisitionError } from './validation';
import { acquisitionDto, scopedRow, RESOURCE_TABLES, type AcquisitionResource } from './storage';
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
/** Исправляет только разрешённые поля ресурса; возвращает старую и новую строки. */
export async function updateAcquisition(client: PoolClient, projectId: number, resource: AcquisitionResource, resourceId: number, body: unknown) {
  const before = await scopedRow(client, resource, projectId, resourceId, true);
  const schema = resource === 'sources' ? sourceInput.partial().extend({ archived: z.boolean().optional() })
    : resource === 'placements' ? placementPatch : resource === 'expenses' ? expensePatch : z.object({ archived: z.boolean() }).strict();
  const input = schema.parse(body) as Record<string, unknown>;
  if (!Object.keys(input).length) throw new AcquisitionError('Укажите изменённые поля');
  if (resource === 'expenses' && input.exchangeRateRubPerUsd !== undefined) {
    input.exchangeRateDate = input.exchangeRateRubPerUsd ? input.exchangeRateDate ?? acquisitionDto(before).exchangeRateDate ?? input.day ?? acquisitionDto(before).day : null;
  }
  if (resource === 'placements') {
    const dto = acquisitionDto(before);
    const first = input.startsOn === undefined ? dto.startsOn : input.startsOn;
    const last = input.endsOn === undefined ? dto.endsOn : input.endsOn;
    if (first && last && String(last) < String(first)) throw new AcquisitionError('Последний день раньше первого');
  }
  const columns = Object.entries(input).map(([key, value]) => [key === 'archived' ? 'archived_at' : key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`), key === 'archived' ? value ? new Date() : null : value] as const);
  const assignments = columns.map(([column], index) => `${column}=$${index + 3}`).join(',');
  const result = await client.query(`UPDATE ${RESOURCE_TABLES[resource]} SET ${assignments}${resource === 'expenses' ? ',updated_at=now()' : ''} WHERE project_id=$1 AND id=$2 RETURNING *`, [projectId,resourceId,...columns.map(([,value]) => value)]);
  return { before, row: result.rows[0] as Record<string, any> };
}
