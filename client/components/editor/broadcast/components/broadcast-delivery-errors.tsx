/**
 * @fileoverview Список ошибок доставки рассылки с ленивой загрузкой и поиском
 * @module client/components/editor/broadcast/components/broadcast-delivery-errors
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Search, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useBroadcastDetail } from '../hooks/use-broadcast-detail';
import { useBroadcastLiveProgress } from '../hooks/use-broadcast-live-progress';
import type { BroadcastResult } from '../types';

/**
 * Фильтрует ошибки доставки по User ID и тексту причины
 * @param results - Список результатов рассылки
 * @param query - Строка поиска
 * @returns Отфильтрованный список
 */
function filterDeliveryErrors(results: BroadcastResult[], query: string): BroadcastResult[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return results;
  return results.filter((r) => {
    const reason = (r.errorMessage ?? r.status).toLowerCase();
    return r.userId.toLowerCase().includes(normalized) || reason.includes(normalized);
  });
}

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
 * Отображает ошибки доставки рассылки: скелетон, пустое состояние или таблицу в аккордеоне.
 * При росте liveFailedCount (WS) debounce-инвалидирует detail query для подгрузки новых ошибок.
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
  const { results, isLoading } = useBroadcastDetail(
    projectId,
    enabled ? broadcastId : null,
  );

  const resolvedFailedCount = liveFailedCount ?? progressEvent?.failedCount;

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
  const isFiltering = search.trim().length > 0;

  if (isLoading) {
    return <Skeleton className={compact ? 'h-10 w-full' : 'h-16 w-full'} />;
  }

  if (results.length === 0) {
    return (
      <p className={`text-muted-foreground flex items-center gap-1.5 ${compact ? 'text-[10px]' : 'text-xs'}`}>
        <CheckCircle2 className={`text-green-500 ${compact ? 'h-3 w-3' : 'h-3.5 w-3.5'}`} />
        Ошибок нет
      </p>
    );
  }

  return (
    <Collapsible defaultOpen={compact}>
      <CollapsibleTrigger
        className={`flex items-center gap-2 font-medium text-red-600 hover:text-red-700 w-full text-left ${
          compact ? 'text-[10px]' : 'text-sm'
        }`}
      >
        <XCircle className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
        Ошибки доставки ({isFiltering ? `${filteredResults.length} из ${results.length}` : results.length})
      </CollapsibleTrigger>
      <CollapsibleContent className={`mt-2 border rounded-lg overflow-hidden ${compact ? 'max-h-52 overflow-y-auto' : ''}`}>
        <div className={`border-b bg-muted/30 ${compact ? 'p-1.5' : 'p-2'}`}>
          <div className="relative">
            <Search className={`absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground ${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по User ID или ошибке"
              className={compact ? 'h-7 pl-7 text-[10px]' : 'h-8 pl-8 text-xs'}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
        {filteredResults.length === 0 ? (
          <p className={`text-muted-foreground text-center py-3 ${compact ? 'text-[10px]' : 'text-xs'}`}>
            Ничего не найдено
          </p>
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">User ID</TableHead>
              <TableHead className="text-xs">Причина</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredResults.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.userId}</TableCell>
                <TableCell className="text-xs text-red-500">{r.errorMessage ?? r.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
