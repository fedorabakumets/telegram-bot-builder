/**
 * @fileoverview Список ошибок доставки рассылки с ленивой загрузкой и поиском
 * @module client/components/editor/broadcast/components/broadcast-delivery-errors
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useBroadcastDetail } from '../hooks/use-broadcast-detail';
import { useBroadcastLiveProgress } from '../hooks/use-broadcast-live-progress';
import {
  countDeliveryErrorBreakdown,
  filterDeliveryErrors,
  hasUnauthorizedBotResult,
} from '../utils/delivery-error-stats';
import { DeliveryProblemChips } from './delivery-problem-chips';
import { BroadcastDeliveryEmpty } from './broadcast-delivery-empty';
import { BroadcastDeliveryErrorsTable } from './broadcast-delivery-errors-table';
import { BroadcastUnauthorizedHint } from './broadcast-unauthorized-hint';

/**
 * Пропсы компонента BroadcastDeliveryErrors
 */
interface BroadcastDeliveryErrorsProps {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор рассылки */
  broadcastId: number;
  /** Выполнять запрос только при true (ленивая загрузка) */
  enabled?: boolean;
  /** Компактный режим для пузыря в чате */
  compact?: boolean;
  /** Live-счётчик ошибок от родителя (WS); при росте инвалидирует detail query */
  liveFailedCount?: number;
}

/**
 * Отображает ошибки доставки: скелетон, пустое состояние или таблицу в аккордеоне.
 * @param props - Свойства компонента
 * @returns JSX элемент списка ошибок
 */
export function BroadcastDeliveryErrors({
  projectId,
  broadcastId,
  enabled = true,
  compact = false,
  liveFailedCount,
}: BroadcastDeliveryErrorsProps) {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const prevFailedRef = useRef<number | undefined>(undefined);
  const invalidateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { progressEvent } = useBroadcastLiveProgress(projectId, enabled ? broadcastId : null);
  const { results, isLoading, broadcast } = useBroadcastDetail(projectId, enabled ? broadcastId : null);

  const resolvedFailedCount =
    liveFailedCount ??
    (progressEvent
      ? (progressEvent.failedCount ?? 0) +
        (progressEvent.blockedCount ?? 0) +
        (progressEvent.deletedCount ?? 0)
      : undefined);

  useEffect(() => {
    if (!enabled || resolvedFailedCount === undefined) return;
    const prev = prevFailedRef.current;
    prevFailedRef.current = resolvedFailedCount;
    if (prev !== undefined && resolvedFailedCount > prev) {
      if (invalidateTimerRef.current) clearTimeout(invalidateTimerRef.current);
      invalidateTimerRef.current = setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: [`/api/projects/${projectId}/broadcasts/${broadcastId}`],
        });
        invalidateTimerRef.current = null;
      }, 1500);
    }
    return () => {
      if (invalidateTimerRef.current) {
        clearTimeout(invalidateTimerRef.current);
        invalidateTimerRef.current = null;
      }
    };
  }, [resolvedFailedCount, enabled, projectId, broadcastId, queryClient]);

  const filteredResults = useMemo(
    () => filterDeliveryErrors(results, search),
    [results, search],
  );
  const byStatus = useMemo(() => countDeliveryErrorBreakdown(results), [results]);
  const isFiltering = search.trim().length > 0;
  const tokenInvalid =
    hasUnauthorizedBotResult(results) || progressEvent?.abortReason === 'unauthorized';

  if (isLoading) {
    return <Skeleton className={compact ? 'h-10 w-full' : 'h-16 w-full'} />;
  }

  if (results.length === 0 && !tokenInvalid) {
    const blocked = progressEvent?.blockedCount ?? broadcast?.blockedCount ?? 0;
    const deleted = progressEvent?.deletedCount ?? broadcast?.deletedCount ?? 0;
    const failed = progressEvent?.failedCount ?? broadcast?.failedCount ?? 0;
    const problemCount = resolvedFailedCount ?? blocked + deleted + failed;
    return (
      <BroadcastDeliveryEmpty
        problemCount={problemCount}
        blocked={blocked}
        deleted={deleted}
        failed={failed}
      />
    );
  }

  const header = (
    <div className="flex w-full flex-wrap items-center gap-x-2 gap-y-1">
      <span className="text-sm font-medium text-foreground">
        {isFiltering
          ? `Найдено ${filteredResults.length} из ${byStatus.blocked + byStatus.deleted + byStatus.failed}`
          : `Всего проблем: ${filteredResults.length}`}
      </span>
      {!isFiltering && (
        <DeliveryProblemChips
          blocked={byStatus.blocked}
          deleted={byStatus.deleted}
          failed={byStatus.failed}
          showLabels
          size="md"
        />
      )}
    </div>
  );

  const table = (
    <BroadcastDeliveryErrorsTable
      results={filteredResults}
      search={search}
      onSearchChange={setSearch}
      compact={compact}
    />
  );

  if (compact) {
    return (
      <div className="space-y-1.5">
        {tokenInvalid && <BroadcastUnauthorizedHint />}
        {(filteredResults.length > 0 || isFiltering) && header}
        {(filteredResults.length > 0 || isFiltering) && table}
      </div>
    );
  }

  return (
    <Collapsible>
      <CollapsibleTrigger className="w-full text-left">{header}</CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-1.5">
        {tokenInvalid && <BroadcastUnauthorizedHint />}
        {table}
      </CollapsibleContent>
    </Collapsible>
  );
}
