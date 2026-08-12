/**
 * @fileoverview Раскрываемый список ботов большой рассылки с их статусами
 * @module editor/database/dialog/components/campaign-bots-list
 */

import { Bot, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProjectTokens } from '@/hooks/use-project-tokens';
import { formatBotShortLabel } from '@/components/editor/broadcast/utils/format-bot-label';
import type { BroadcastProgressEvent } from '@/components/editor/broadcast/types';
import type { Broadcast } from '@shared/schema';

/**
 * Пропсы компонента CampaignBotsList
 */
interface CampaignBotsListProps {
  /** Идентификатор проекта */
  projectId: number;
  /** Рассылки по каждому боту */
  broadcasts: Broadcast[];
  /** Live-прогресс по каждой рассылке */
  liveByBroadcast: Map<number, BroadcastProgressEvent>;
  /** Обработчик удаления рассылки одного бота */
  onDeleteBroadcast?: (broadcastId: number) => void;
  /** Идентификатор рассылки, которая сейчас удаляется */
  deletingBroadcastId?: number | null;
}

/** Подписи статусов рассылки для списка ботов */
const STATUS_LABELS: Record<string, string> = {
  running: 'отправка…',
  done: 'завершена',
  stopped: 'остановлена',
  failed: 'ошибка',
  pending: 'в очереди',
};

/**
 * Список ботов большой рассылки: у каждого свои счётчики и статус.
 * Позволяет удалить рассылку у отдельного бота.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент списка ботов
 */
export function CampaignBotsList({
  projectId,
  broadcasts,
  liveByBroadcast,
  onDeleteBroadcast,
  deletingBroadcastId,
}: CampaignBotsListProps) {
  const tokensInfo = useProjectTokens([projectId]);
  const tokens = tokensInfo[0]?.tokens ?? [];

  if (broadcasts.length === 0) {
    return <p className="text-[10px] text-muted-foreground px-1">Данные по ботам загружаются…</p>;
  }

  return (
    <div className="space-y-1">
      {broadcasts.map((item) => {
        const live = liveByBroadcast.get(item.id);
        const status = live?.status ?? item.status;
        const totalCount = live?.totalCount ?? item.totalCount ?? 0;
        const doneCount = status === 'running'
          ? (live?.sentCount ?? item.sentCount ?? 0)
          : (live?.deliveredCount ?? item.deliveredCount ?? 0);
        const failedCount = live?.failedCount ?? item.failedCount ?? 0;

        return (
          <div key={item.id} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Bot className="h-3 w-3 shrink-0 text-violet-500" />
            <span className="truncate max-w-[110px] text-foreground/80">
              {formatBotShortLabel(tokens.find((token) => token.id === item.tokenId), item.tokenId)}
            </span>
            <span className="shrink-0">{doneCount}/{totalCount}</span>
            {failedCount > 0 && <span className="text-red-500 shrink-0">❌ {failedCount}</span>}
            <span className="shrink-0">{STATUS_LABELS[status] ?? status}</span>
            {onDeleteBroadcast && (
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto h-5 w-5 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => onDeleteBroadcast(item.id)}
                disabled={deletingBroadcastId === item.id}
                title="Удалить рассылку у этого бота"
              >
                {deletingBroadcastId === item.id
                  ? <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  : <Trash2 className="h-2.5 w-2.5" />}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
