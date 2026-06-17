/**
 * @fileoverview Детальная боковая панель выбранной рассылки
 * @module client/components/editor/broadcast/components/broadcast-detail
 */

import { useEffect } from 'react';
import { X, Calendar, Clock, StopCircle, CheckCircle2, XCircle, Users, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BroadcastStatusBadge } from './broadcast-status-badge';
import { StatMini } from './broadcast-stat-mini';
import { MediaPreviewList } from './media-preview';
import { BroadcastDeliveryErrors } from './broadcast-delivery-errors';
import { useBroadcastDetail } from '../hooks/use-broadcast-detail';
import { useStopBroadcast } from '../hooks/use-stop-broadcast';
import { useBroadcastLiveProgress } from '../hooks/use-broadcast-live-progress';
import type { Broadcast } from '../types';

/**
 * Пропсы компонента BroadcastDetail
 */
interface BroadcastDetailProps {
  /** Выбранная рассылка */
  broadcast: Broadcast;
  /** Идентификатор проекта */
  projectId: number;
  /** Обработчик закрытия панели */
  onClose: () => void;
  /** Колбэк обновления списка */
  refetch: () => void;
}

/**
 * Форматирует дату в локальный формат ru-RU.
 * @param date - Дата или null
 * @returns Отформатированная строка или прочерк
 */
function fmt(date: string | Date | null | undefined): string {
  return date ? new Date(date).toLocaleString('ru-RU') : '—';
}

/**
 * Детальная панель рассылки: статистика, даты, кнопка стоп и аккордеон ошибок.
 * Статистика обновляется в реальном времени через WS-события broadcast-progress.
 * При завершении рассылки (done/stopped) автоматически вызывает refetch списка.
 * @param props - Свойства компонента
 * @returns JSX элемент детальной панели
 */
export function BroadcastDetail({ broadcast, projectId, onClose, refetch }: BroadcastDetailProps) {
  const { broadcast: detailBroadcast } = useBroadcastDetail(projectId, broadcast.id);
  const stopMutation = useStopBroadcast({ projectId, refetch });
  const { progressEvent } = useBroadcastLiveProgress(projectId, broadcast.id);

  // При получении финального WS-события обновляем список рассылок
  useEffect(() => {
    if (progressEvent?.status === 'done' || progressEvent?.status === 'stopped') {
      refetch();
    }
  }, [progressEvent?.status]);

  // Приоритет данных: WS-событие > REST-детали > пропсы (замороженный объект)
  const base = detailBroadcast ?? broadcast;
  const liveStatus = progressEvent?.status ?? base.status;
  const total = progressEvent?.totalCount ?? base.totalCount ?? 0;
  const delivered = progressEvent?.deliveredCount ?? base.deliveredCount ?? 0;
  const failed = progressEvent?.failedCount ?? base.failedCount ?? 0;
  const successRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

  return (
    <div className="flex flex-col h-full border-l bg-background">
      {/* Заголовок */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2 min-w-0">
          <BroadcastStatusBadge status={liveStatus} />
          <span className="font-semibold text-sm truncate">{broadcast.name}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {liveStatus === 'running' && (
            <Button size="sm" variant="destructive" className="h-7 text-xs gap-1"
              onClick={() => stopMutation.mutate(broadcast.id)} disabled={stopMutation.isPending}>
              <StopCircle className="h-3.5 w-3.5" />
              Остановить
            </Button>
          )}
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Карточки статистики */}
        <div className="grid grid-cols-2 gap-2">
          <StatMini icon={Users} label="Аудитория" value={total} color="text-blue-600" bg="bg-blue-50 dark:bg-blue-900/20" />
          <StatMini icon={CheckCircle2} label="Доставлено" value={delivered} color="text-green-600" bg="bg-green-50 dark:bg-green-900/20" />
          <StatMini icon={XCircle} label="Ошибок" value={failed} color="text-red-500" bg="bg-red-50 dark:bg-red-900/20" />
          <StatMini icon={Percent} label="Успех" value={`${successRate}%`} color="text-purple-600" bg="bg-purple-50 dark:bg-purple-900/20" />
        </div>

        <Separator />

        {/* Сообщение рассылки */}
        {(base.messageText || (base.mediaUrls && base.mediaUrls.length > 0)) && (
          <>
            <div className="space-y-2">
              <p className="text-sm font-medium">Сообщение</p>
              {base.messageText && (
                <p className="text-xs text-muted-foreground bg-muted/40 rounded p-2 whitespace-pre-wrap">
                  {base.messageText.replace(/<[^>]+>/g, '').slice(0, 150)}
                  {base.messageText.replace(/<[^>]+>/g, '').length > 150 ? '…' : ''}
                </p>
              )}
              <MediaPreviewList mediaUrls={(base.mediaUrls as string[]) ?? []} />
            </div>
            <Separator />
          </>
        )}

        {/* Даты */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>Создана: <span className="text-foreground">{fmt(broadcast.createdAt)}</span></span>
          </div>
          {base.finishedAt && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>Завершена: <span className="text-foreground">{fmt(base.finishedAt)}</span></span>
            </div>
          )}
        </div>

        <Separator />

        {/* Таблица ошибок в аккордеоне */}
        <BroadcastDeliveryErrors projectId={projectId} broadcastId={broadcast.id} />
      </div>
    </div>
  );
}
