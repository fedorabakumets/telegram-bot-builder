/**
 * @fileoverview Прогресс большой рассылки: общий счётчик и разбивка по ботам
 * @module client/components/editor/broadcast/wizard/campaign-progress
 */

import { useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useProjectTokens } from '@/hooks/use-project-tokens';
import { useBroadcastCampaignDetail } from '../hooks/use-broadcast-campaign-detail';
import { useCampaignLiveProgress } from '../hooks/use-campaign-live-progress';
import { useStopBroadcast } from '../hooks/use-stop-broadcast';
import { useStopBroadcastCampaign } from '../hooks/use-stop-broadcast-campaign';
import { CampaignBotProgressRow } from './campaign-bot-progress-row';
import { BroadcastProgressCounters } from '../components/broadcast-progress-counters';
import { formatBotShortLabel, pluralizeBots } from '../utils/format-bot-label';

/**
 * Пропсы компонента CampaignProgress
 */
interface CampaignProgressProps {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор большой рассылки */
  campaignId: number;
  /** Название рассылки для заголовка */
  name?: string;
  /** Колбэк обновления списка рассылок */
  refetch?: () => void;
  /** Колбэк закрытия */
  onClose?: () => void;
}

/**
 * Экран прогресса большой рассылки.
 * Показывает общий прогресс по всем ботам и отдельную строку на каждого бота,
 * обновляясь через WebSocket с опросом деталей раз в 2 секунды как запасной вариант.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент прогресса большой рассылки
 */
export function CampaignProgress({ projectId, campaignId, name, refetch, onClose }: CampaignProgressProps) {
  const { campaign, broadcasts, refetch: refetchDetail } = useBroadcastCampaignDetail(projectId, campaignId);
  const { totals, byBroadcast } = useCampaignLiveProgress(projectId, campaignId);
  const tokensInfo = useProjectTokens([projectId]);
  const tokens = tokensInfo[0]?.tokens ?? [];

  const stopChildMutation = useStopBroadcast({ projectId, refetch: refetchDetail });
  const stopAllMutation = useStopBroadcastCampaign({
    projectId,
    refetch: () => {
      refetchDetail();
      refetch?.();
    },
  });

  /** Итоговые счётчики: приоритет у live-событий, иначе агрегаты из БД */
  const sentCount = totals?.sentCount ?? campaign?.sentCount ?? 0;
  const deliveredCount = totals?.deliveredCount ?? campaign?.deliveredCount ?? 0;
  const failedCount = totals?.failedCount ?? campaign?.failedCount ?? 0;
  const blockedCount = totals?.blockedCount ?? campaign?.blockedCount ?? 0;
  const deletedCount = totals?.deletedCount ?? campaign?.deletedCount ?? 0;
  const totalCount = totals?.totalCount || campaign?.totalCount || 0;

  const hasRunningChild = broadcasts.some((item) => item.status === 'running');
  const isRunning = totals?.isRunning ?? (hasRunningChild || campaign?.status === 'running');
  const percent = totalCount > 0 ? Math.round((sentCount / totalCount) * 100) : 0;
  const remaining = Math.max(0, totalCount - sentCount);

  /** Опрос деталей как запасной вариант, если WS-события приходят редко */
  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => void refetchDetail(), 2000);
    return () => clearInterval(timer);
  }, [isRunning, refetchDetail]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium truncate">{name || campaign?.name || 'Рассылка'}</p>
        <span className="text-xs text-muted-foreground shrink-0">{percent}%</span>
      </div>

      <Progress value={percent} className="h-3" />

      <BroadcastProgressCounters
        deliveredCount={deliveredCount}
        blockedCount={blockedCount}
        deletedCount={deletedCount}
        failedCount={failedCount}
        remaining={remaining}
      />

      {/* Разбивка по ботам */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          {broadcasts.length} {pluralizeBots(broadcasts.length)} отправляют параллельно
        </p>
        {broadcasts.map((item) => (
          <CampaignBotProgressRow
            key={item.id}
            broadcast={item}
            botLabel={formatBotShortLabel(tokens.find((token) => token.id === item.tokenId), item.tokenId)}
            liveEvent={byBroadcast.get(item.id)}
            onStop={(broadcastId) => stopChildMutation.mutate(broadcastId)}
            isStopping={stopChildMutation.isPending}
          />
        ))}
      </div>

      {isRunning ? (
        <div className="flex justify-center">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => stopAllMutation.mutate(campaignId)}
            disabled={stopAllMutation.isPending}
          >
            ⏸ Остановить у всех ботов
          </Button>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-3">
            {campaign?.status === 'stopped' ? '⏸ Рассылка остановлена' : '✅ Рассылка завершена'}
          </p>
          <Button variant="outline" onClick={onClose}>Закрыть</Button>
        </div>
      )}
    </div>
  );
}
