/**
 * @fileoverview Компонент отображения прогресса активной рассылки
 * @module client/components/editor/broadcast/wizard/broadcast-progress
 */

import { useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useBroadcastLiveProgress } from '../hooks/use-broadcast-live-progress';
import { useBroadcastDetail } from '../hooks/use-broadcast-detail';
import { useStopBroadcast } from '../hooks/use-stop-broadcast';
import { resolveBroadcastDisplayName } from '../utils/resolve-broadcast-display-name';
import { BroadcastProgressCounters } from '../components/broadcast-progress-counters';
import type { Broadcast } from '../types';

/**
 * Пропсы компонента BroadcastProgress
 */
interface BroadcastProgressProps {
  /** Идентификатор проекта */
  projectId: number;
  /** Данные рассылки */
  broadcast: Broadcast;
  /** Колбэк обновления списка */
  refetch?: () => void;
  /** Колбэк закрытия */
  onClose?: () => void;
}

/**
 * Компонент прогресса рассылки с live-обновлением через WebSocket.
 * Показывает прогресс-бар, счётчики и кнопку остановки.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент прогресса рассылки
 */
export function BroadcastProgress({ projectId, broadcast, refetch, onClose }: BroadcastProgressProps) {
  const { progressEvent } = useBroadcastLiveProgress(projectId, broadcast.id);
  const { broadcast: detailBroadcast, refetch: refetchDetail } = useBroadcastDetail(projectId, broadcast.id);
  const stopMutation = useStopBroadcast({ projectId, refetch });

  const base = detailBroadcast ?? broadcast;
  const sentCount = progressEvent?.sentCount ?? base.sentCount ?? 0;
  const deliveredCount = progressEvent?.deliveredCount ?? base.deliveredCount ?? 0;
  const failedCount = progressEvent?.failedCount ?? base.failedCount ?? 0;
  const blockedCount = progressEvent?.blockedCount ?? base.blockedCount ?? 0;
  const deletedCount = progressEvent?.deletedCount ?? base.deletedCount ?? 0;
  const totalCount = progressEvent?.totalCount ?? base.totalCount ?? 0;
  const status = progressEvent?.status ?? base.status;

  /** Polling как fallback, если WS-события приходят редко */
  useEffect(() => {
    if (status === 'done' || status === 'stopped' || status === 'failed') return;
    void refetchDetail();
    const timer = setInterval(() => void refetchDetail(), 2000);
    return () => clearInterval(timer);
  }, [status, refetchDetail]);

  const percent = totalCount > 0 ? Math.round((sentCount / totalCount) * 100) : 0;
  const remaining = Math.max(0, totalCount - sentCount);
  const isDone = status === 'done' || status === 'stopped';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium truncate">
          {resolveBroadcastDisplayName(broadcast.name, broadcast.messageText, broadcast.createdAt)}
        </p>
        <span className="text-xs text-muted-foreground">{percent}%</span>
      </div>

      <Progress value={percent} className="h-3" />

      <BroadcastProgressCounters
        deliveredCount={deliveredCount}
        blockedCount={blockedCount}
        deletedCount={deletedCount}
        failedCount={failedCount}
        remaining={remaining}
      />

      {isDone ? (
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-3">
            {status === 'done' ? '✅ Рассылка завершена' : '⏸ Рассылка остановлена'}
          </p>
          <Button variant="outline" onClick={onClose}>Закрыть</Button>
        </div>
      ) : (
        <div className="flex justify-center">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => stopMutation.mutate(broadcast.id)}
            disabled={stopMutation.isPending}
          >
            ⏸ Остановить
          </Button>
        </div>
      )}
    </div>
  );
}
