/**
 * @fileoverview Строка прогресса рассылки по одному боту внутри большой рассылки
 * @module client/components/editor/broadcast/wizard/campaign-bot-progress-row
 */

import { Bot, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { Broadcast, BroadcastProgressEvent } from '../types';

/**
 * Пропсы компонента CampaignBotProgressRow
 */
interface CampaignBotProgressRowProps {
  /** Рассылка одного бота */
  broadcast: Broadcast;
  /** Подпись бота */
  botLabel: string;
  /** Последнее live-событие прогресса этой рассылки */
  liveEvent?: BroadcastProgressEvent;
  /** Обработчик остановки рассылки этого бота */
  onStop?: (broadcastId: number) => void;
  /** Идёт ли остановка */
  isStopping?: boolean;
}

/**
 * Строка одного бота: подпись, прогресс-бар и счётчики отправки.
 * Данные берутся из live-события, при его отсутствии — из БД.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент строки прогресса бота
 */
export function CampaignBotProgressRow({
  broadcast,
  botLabel,
  liveEvent,
  onStop,
  isStopping,
}: CampaignBotProgressRowProps) {
  const sentCount = liveEvent?.sentCount ?? broadcast.sentCount ?? 0;
  const deliveredCount = liveEvent?.deliveredCount ?? broadcast.deliveredCount ?? 0;
  const failedCount = liveEvent?.failedCount ?? broadcast.failedCount ?? 0;
  const blockedCount = liveEvent?.blockedCount ?? broadcast.blockedCount ?? 0;
  const deletedCount = liveEvent?.deletedCount ?? broadcast.deletedCount ?? 0;
  const totalCount = liveEvent?.totalCount ?? broadcast.totalCount ?? 0;
  const status = liveEvent?.status ?? broadcast.status;
  const percent = totalCount > 0 ? Math.round((sentCount / totalCount) * 100) : 0;
  const isRunning = status === 'running';

  return (
    <div className="rounded-lg border p-2.5 space-y-1.5">
      <div className="flex items-center gap-2">
        <Bot className="w-3.5 h-3.5 text-violet-500 shrink-0" />
        <span className="text-sm font-medium truncate">{botLabel}</span>
        <span className="ml-auto text-xs text-muted-foreground shrink-0">{percent}%</span>
        {isRunning && onStop && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={() => onStop(broadcast.id)}
            disabled={isStopping}
            title="Остановить у этого бота"
          >
            <Square className="h-3 w-3" />
          </Button>
        )}
      </div>

      <Progress value={percent} className="h-1.5" />

      <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-muted-foreground">
        <span className="text-green-600 dark:text-green-400">✅ {deliveredCount}</span>
        {blockedCount > 0 && <span className="text-amber-600">🚫 {blockedCount}</span>}
        {deletedCount > 0 && <span className="text-orange-600">🗑 {deletedCount}</span>}
        {failedCount > 0 && <span className="text-red-500">❌ {failedCount}</span>}
        <span>
          {sentCount} / {totalCount}
        </span>
        {!isRunning && (
          <span>{status === 'stopped' ? '⏸ остановлена' : status === 'done' ? '✓ завершена' : status}</span>
        )}
      </div>
    </div>
  );
}
