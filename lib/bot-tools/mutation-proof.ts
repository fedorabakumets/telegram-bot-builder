/**
 * @fileoverview Квитанции проверенного сохранения и повторное чтение через авторизованный API.
 */
import { apiFetch } from './api-fetch.ts';
/** Дополнительные поля результата без изменения прежних полезных полей. */
export interface MutationReceipt {
 /** Идентификатор постоянной заявки при наличии. */
 requestId?: string;
 /** Автоматический повтор неоднозначного действия запрещён. */
 retryable?: false;
 /** Разрешённая часть квитанции уже созданного объекта. */
 receipt?: { projectId?: number; resourceId?: number } | null;
 /** Тип эффекта. */
 effect: 'application' | 'external';
 /** Исход действия. */
 outcome: 'saved' | 'pending' | 'partial' | 'unknown';
 /** Проверяемое подтверждение либо его отсутствие. */
 persistence: { confirmed: boolean; method: string; resource?: string };
}
/** Совместимое расширение прежнего объединения результатов. */
export type MutationResult<T> = T & Partial<MutationReceipt>;
/** Неизвестный исход нельзя автоматически повторять. */
export interface MutationUnknown {
 /** Безопасный идентификатор результата для сверки после неподтверждённой записи. */
 receipt?: { projectId?: number; resourceId?: number };
 /** Причина отсутствия подтверждения. */
 error: string;
 /** Состояние результата. */
 outcome: 'unknown';
 /** Проверка не подтвердила действие. */
 persistence: { confirmed: false; method: 'readback' };
}
/**
 * Перечитывает серверное состояние и подтверждает конкретное ожидаемое значение.
 * @param result - Прежние безопасные поля результата
 * @param resource - Авторизованный путь повторного чтения
 * @param matches - Предикат конкретного ожидаемого состояния
 * @param options - Адрес API и признак ожидаемого удаления
 * @returns Подтверждённый результат либо явно неизвестный исход
 */
export async function verifyMutation<T extends object>(result: T, resource: string, matches: (body: any) => boolean,
 options?: { apiBaseUrl?: string; absent?: boolean; effect?: 'application' | 'external' }): Promise<(T & MutationReceipt) | MutationUnknown> {
 try {
  const response = await apiFetch(resource, { apiBaseUrl: options?.apiBaseUrl });
  const verified = options?.absent === true ? response.status === 404 : response.ok && matches(await response.json());
  if (!verified) throw new Error('Состояние сервера не совпало с ожидаемым');
  return { ...result, effect: options?.effect ?? 'application', outcome: 'saved', persistence: { confirmed: true, method: 'readback', resource } };
 } catch {
  const value = result as Record<string, unknown>;
  const projectId = Number.isSafeInteger(value.projectId) ? Number(value.projectId) : undefined;
  const resourceId = Number.isSafeInteger(value.id) ? Number(value.id) : undefined;
  return { error: 'Сохранение не подтверждено повторным чтением. Сверьте состояние перед повтором.', outcome: 'unknown',
   ...(projectId !== undefined || resourceId !== undefined ? { receipt: { ...(projectId !== undefined ? { projectId } : {}), ...(resourceId !== undefined ? { resourceId } : {}) } } : {}),
   persistence: { confirmed: false, method: 'readback' } };
 }
}

/**
 * Сохраняет неопределённый durable-ответ и разрешённый ID частичного результата.
 * @param body - Ответ постоянного журнала
 * @returns Неизвестный исход без раскрытия тела проекта
 */
export function durableMutationUnknown(body: unknown) {
 const value = body && typeof body === 'object' ? body as Record<string, any> : {};
 const partialId = value.receipt?.projectId ?? value.receipt?.id;
 return { error: 'Исход заявки неизвестен. Автоматический повтор запрещён; сверьте частичный результат.',
  effect: 'application' as const, outcome: 'unknown' as const, retryable: false as const,
  ...(typeof value.requestId === 'string' ? { requestId: value.requestId } : {}),
  receipt: Number.isSafeInteger(partialId) ? { projectId: partialId as number } : null,
  persistence: { confirmed: false, method: 'durable_request' } };
}
