/** @fileoverview Общий HTTP-адаптер новой аналитики для обоих транспортов MCP. */
import { apiFetch } from './api-fetch.ts';
/** Разрешённые сущности конструктора ссылок. */
export type AnalyticsAcquisitionResource = 'sources' | 'placements' | 'links' | 'expenses';
/** Параметры обращения к авторизованному API приложения. */
export interface AnalyticsApiRequest {
  /** Проект текущего пользователя. */ projectId: number;
  /** Относительный endpoint только аналитики. */ endpoint: string;
  /** HTTP-метод. */ method?: 'GET' | 'POST' | 'PATCH';
  /** Точное тело API без повторных вычислений. */ body?: unknown;
  /** Строковые фильтры снимка или отчёта. */ query?: Record<string, string | number | undefined>;
}
/**
 * Передаёт фильтры/денежные строки в API и возвращает тот же снимок без локального SQL.
 * @param request - Проект, путь, метод и данные.
 * @returns Ответ API без преобразования decimal, null, времени снимка и полноты истории.
 */
export async function requestAnalyticsV2(request: AnalyticsApiRequest): Promise<unknown> {
  if (!Number.isSafeInteger(request.projectId) || request.projectId <= 0) return { error: 'Некорректный проект' };
  if (!/^(v2\/snapshot|acquisition(?:\/(?:report|sources|placements|links|expenses)(?:\/\d+(?:\/history)?)?)?)$/.test(request.endpoint)) return { error: 'Неизвестный ресурс аналитики' };
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(request.query ?? {})) if (value !== undefined) query.set(key, String(value));
  try {
    const response = await apiFetch(`/api/projects/${request.projectId}/analytics/${request.endpoint}${query.size ? `?${query}` : ''}`, {
      method: request.method ?? 'GET',
      ...(request.body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request.body) }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      return { error: typeof body?.message === 'string' && [400,409].includes(response.status) ? body.message : `API аналитики недоступен: HTTP ${response.status}`, status: response.status };
    }
    return await response.json();
  } catch { return { error: 'Не удалось получить ответ API аналитики' }; }
}
/** Формирует обычный MCP-ответ, сохраняя ошибку транспорта явной. */
export function analyticsMcpResult(value: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(value) }],
    ...(value && typeof value === 'object' && 'error' in value ? { isError: true } : {}) };
}
