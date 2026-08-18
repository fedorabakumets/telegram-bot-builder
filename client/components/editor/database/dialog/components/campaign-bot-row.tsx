/**
 * @fileoverview Строка одного бота в пузыре большой рассылки
 * @module editor/database/dialog/components/campaign-bot-row
 */

import { Bot, ChevronDown, ChevronUp, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BroadcastDeliveryErrors } from '@/components/editor/broadcast/components/broadcast-delivery-errors';
import { BroadcastUnauthorizedHint } from '@/components/editor/broadcast/components/broadcast-unauthorized-hint';
import { DeliveryProblemChips } from '@/components/editor/broadcast/components/delivery-problem-chips';
import { getCampaignStatusBadge } from '../utils/campaign-status-badge';
import type { BroadcastProgressEvent } from '@/components/editor/broadcast/types';
import type { Broadcast } from '@shared/schema';

/**
 * Пропсы строки бота большой рассылки
 */
interface CampaignBotRowProps {
  /** Идентификатор проекта */
  projectId: number;
  /** Рассылка этого бота */
  item: Broadcast;
  /** Live-прогресс рассылки */
  live?: BroadcastProgressEvent;
  /** Подпись бота */
  botLabel: string;
  /** Раскрыт ли список ошибок */
  isOpen: boolean;
  /** Переключить раскрытие ошибок */
  onToggle: () => void;
  /** Запросить удаление рассылки этого бота */
  onDeleteBroadcast?: () => void;
  /** Идёт ли удаление этой рассылки */
  isDeleting?: boolean;
}

/**
 * Карточка бота: прогресс, чипы проблем и раскрываемые ошибки
 * @param props - Свойства строки
 * @returns JSX элемент
 */
export function CampaignBotRow({
  projectId,
  item,
  live,
  botLabel,
  isOpen,
  onToggle,
  onDeleteBroadcast,
  isDeleting = false,
}: CampaignBotRowProps) {
  const status = live?.status ?? item.status;
  const totalCount = live?.totalCount ?? item.totalCount ?? 0;
  const doneCount = status === 'running'
    ? (live?.sentCount ?? item.sentCount ?? 0)
    : (live?.deliveredCount ?? item.deliveredCount ?? 0);
  const failedCount = live?.failedCount ?? item.failedCount ?? 0;
  const blockedCount = live?.blockedCount ?? item.blockedCount ?? 0;
  const deletedCount = live?.deletedCount ?? item.deletedCount ?? 0;
  const problemCount = failedCount + blockedCount + deletedCount;
  const tokenInvalid = live?.abortReason === 'unauthorized' || status === 'failed';
  const canExpand = problemCount > 0 || tokenInvalid;
  const badge = getCampaignStatusBadge(status);
  const ExpandIcon = isOpen ? ChevronUp : ChevronDown;

  return (
    <div className="rounded-md border border-border/50 bg-muted/20 px-2 py-1.5 transition-colors hover:bg-muted/40">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
          onClick={onToggle}
          title={isOpen ? 'Скрыть проблемы' : 'Показать проблемы доставки'}
        >
          {canExpand
            ? <ExpandIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            : <Bot className="h-3.5 w-3.5 shrink-0 text-violet-500" />}
          <span className="truncate text-xs font-medium text-foreground">{botLabel}</span>
          <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
            {doneCount}/{totalCount}
          </span>
        </button>
        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${badge.className}`}>
          {badge.label}
        </span>
        {onDeleteBroadcast && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative z-10 h-5 w-5 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onDeleteBroadcast();
            }}
            disabled={isDeleting}
            title="Удалить рассылку у этого бота"
          >
            {isDeleting
              ? <Loader2 className="h-2.5 w-2.5 animate-spin" />
              : <Trash2 className="h-2.5 w-2.5" />}
          </Button>
        )}
      </div>
      {tokenInvalid && !isOpen && (
        <div className="mt-1.5">
          <BroadcastUnauthorizedHint />
        </div>
      )}
      {problemCount > 0 && !isOpen && (
        <button type="button" className="mt-1.5 w-full text-left" onClick={onToggle}>
          <DeliveryProblemChips blocked={blockedCount} deleted={deletedCount} failed={failedCount} />
        </button>
      )}
      {isOpen && (
        <div className="mt-1.5 border-t border-border/40 pt-1.5">
          <BroadcastDeliveryErrors
            projectId={projectId}
            broadcastId={item.id}
            enabled={isOpen}
            compact
            liveFailedCount={tokenInvalid ? Math.max(problemCount, 1) : problemCount}
          />
        </div>
      )}
    </div>
  );
}
