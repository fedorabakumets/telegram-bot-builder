/** @fileoverview Справочники и рекламный отчёт без мигания при фоновом сдвиге того же периода. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { acquisitionCalendarRange } from './acquisition-calendar-range';
import { analyticsJson } from './use-analytics-snapshot';
import type { AcquisitionCatalog, AcquisitionReportRow } from './acquisition-types';
/** Загружает справочники без фонового опроса. @param projectId - Проект. @returns Запрос каталога источников и расходов. */
export function useAcquisition(projectId: number) {
  return useQuery<AcquisitionCatalog>({ queryKey: ['analytics-acquisition', projectId, 'catalog'], queryFn: ({ signal }) => analyticsJson(`/api/projects/${projectId}/analytics/acquisition`, { signal }), staleTime: Infinity, refetchOnMount: 'always', retry: 1 });
}
/**
 * Запрашивает рекламный отчёт строго по границам текущего снимка.
 * @param projectId - Проект.
 * @param tokenId - Выбранный бот.
 * @param range - Границы согласованного снимка.
 * @param currency - Валюта ручного пересчёта.
 * @param lifetime - Показать весь срок размещений.
 * @returns Запрос результатов рекламы.
 */
export function useAcquisitionReport(projectId: number, tokenId: number | null | undefined, range: { /** Начало. */ from: string; /** Конец. */ to: string; /** Пояс. */ timezone: string; /** Тип скользящего периода; отсутствует у календарного диапазона. */ period?: string | null } | undefined, currency: string, lifetime: boolean) {
  const reportRange = range ? acquisitionCalendarRange(range) : undefined;
  return useQuery<{ /** Результаты размещений. */ rows: AcquisitionReportRow[]; /** Момент снимка. */ asOf: string; /** Начало календарного окна. */ from?: string; /** Конец окна. */ to?: string; /** Пояс. */ timezone?: string }>({
    queryKey: ['analytics-acquisition', projectId, 'report', tokenId ?? null, lifetime ? null : reportRange?.from, lifetime ? null : reportRange?.to, reportRange?.timezone, currency, lifetime, lifetime ? null : reportRange?.period],
    enabled: !!reportRange, staleTime: Infinity, retry: 1, refetchOnWindowFocus: false,
    /** Держим строки только при фоновом сдвиге того же окна; другие фильтры не получают старые числа. */
    placeholderData: (previous, previousQuery) => {
      const key = previousQuery?.queryKey;
      if (!key || key[1] !== projectId || key[3] !== (tokenId ?? null) || key[6] !== reportRange?.timezone || key[7] !== currency || key[8] !== lifetime || key[9] !== (lifetime ? null : reportRange?.period)) return undefined;
      if (!lifetime && !reportRange?.period && (key[4] !== reportRange?.from || key[5] !== reportRange?.to)) return undefined;
      return previous;
    },
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({ timezone: reportRange!.timezone, currency, includeSources: 'true' });
      if (!lifetime) { params.set('from', reportRange!.from); params.set('to', reportRange!.to); }
      if (tokenId != null) params.set('tokenId', String(tokenId));
      return analyticsJson(`/api/projects/${projectId}/analytics/acquisition/report?${params}`, { signal });
    },
  });
}
/** Сохраняет ресурс и обновляет снимок. @param projectId - Проект. @returns Мутация каталога или дневного расхода. */
export function useAcquisitionMutation(projectId: number) {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ resource, body, id }: { /** Ресурс API. */ resource: string; /** Поля формы. */ body: unknown; /** Редактируемый ID. */ id?: number }) => analyticsJson<{ /** Созданная запись. */ item?: unknown; /** Созданные расходы. */ items?: unknown[] }>(`/api/projects/${projectId}/analytics/acquisition/${resource}${id ? `/${id}` : ''}`, { method: id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    onSuccess: async () => { await client.invalidateQueries({ queryKey: ['analytics-acquisition', projectId] }); await client.invalidateQueries({ queryKey: ['analytics-v2', projectId] }); },
  });
}
