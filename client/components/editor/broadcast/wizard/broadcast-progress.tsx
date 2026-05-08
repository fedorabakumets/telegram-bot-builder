/**
 * @fileoverview Компонент отображения прогресса активной рассылки
 * @module client/components/editor/broadcast/wizard/broadcast-progress
 */

import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useBroadcastLiveProgress } from '../hooks/use-broadcast-live-progress';
import { useStopBroadcast } from '../hooks/use-stop-broadcast';
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
  const stopMutation = useStopBroadcast({ projectId, refetch });

  // Используем данные из WS-события если есть, иначе из broadcast
  const sentCount = progressEvent?.sentCount ?? broadcast.sentCount;
  const deliveredCount = progressEvent?.deliveredCount ?? broadcast.deliveredCount;
  const failedCount = progressEvent?.failedCount ?? broadcast.failedCount;
  const totalCount = progressEvent?.totalCount ?? broadcast.totalCount;
  const status = progressEvent?.status ?? broadcast.status;

  const percent = totalCount > 0 ? Math.round((sentCount / totalCount) * 100) : 0;
  const remaining = Math.max(0, totalCount - sentCount);
  const isDone = status === 'done' || status === 'stopped';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{broadcast.name}</p>
        <span className="text-xs text-muted-foreground">{percent}%</span>
      </div>

      <Progress value={percent} className="h-3" />

      <div className="grid grid-cols-3 gap-3 text-center text-sm">
        <div className="border rounded p-2">
          <div className="text-lg font-bold text-green-600">{deliveredCount}</div>
          <div className="text-xs text-muted-foreground">✅ Доставлено</div>
        </div>
        <div className="border rounded p-2">
          <div className="text-lg font-bold text-red-500">{failedCount}</div>
          <div className="text-xs text-muted-foreground">❌ Ошибок</div>
        </div>
        <div className="border rounded p-2">
          <div className="text-lg font-bold">{remaining}</div>
          <div className="text-xs text-muted-foreground">⏳ Осталось</div>
        </div>
      </div>

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
