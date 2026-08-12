/**
 * @fileoverview Превью последней рассылки в строке «Рассылка» списка диалогов
 * @module editor/database/user-database/dialogs-tab/broadcast-row-preview
 */

import { useMemo } from 'react';
import { useBroadcasts } from '@/components/editor/broadcast/hooks/use-broadcasts';
import { useBroadcastCampaigns } from '@/components/editor/broadcast/hooks/use-broadcast-campaigns';
import { useBroadcastLiveProgress } from '@/components/editor/broadcast/hooks/use-broadcast-live-progress';
import { useCampaignLiveProgress } from '@/components/editor/broadcast/hooks/use-campaign-live-progress';
import { buildBroadcastTimeline } from '@/components/editor/database/dialog/utils/build-broadcast-timeline';
import type { Broadcast, BroadcastCampaign } from '@shared/schema';

/**
 * Пропсы компонентов превью рассылки
 */
interface BroadcastRowPreviewProps {
  /** ID проекта */
  projectId: number;
  /** ID выбранного токена бота */
  selectedTokenId?: number | null;
}

/**
 * Убирает HTML-разметку и обрезает текст для превью
 * @param messageText - Исходный HTML-текст рассылки
 * @returns Короткий текст без разметки
 */
function toPreviewText(messageText: string | null | undefined): string {
  if (!messageText) return 'Нет рассылок';
  return messageText.replace(/<[^>]*>/g, '').slice(0, 40);
}

/**
 * Живой счётчик одиночной рассылки
 * @param props - Проект и данные рассылки
 * @returns JSX строка прогресса или null
 */
function SingleProgress({ projectId, broadcast }: { projectId: number; broadcast: Broadcast }) {
  const { progressEvent } = useBroadcastLiveProgress(projectId, broadcast.id);
  const status = progressEvent?.status ?? broadcast.status;
  if (status !== 'running') return null;

  const sent = progressEvent?.sentCount ?? broadcast.sentCount ?? 0;
  const total = progressEvent?.totalCount ?? broadcast.totalCount ?? 0;
  return <span className="text-[10px] text-blue-600 dark:text-blue-400 shrink-0">⏳ {sent}/{total}</span>;
}

/**
 * Живой счётчик рассылки по нескольким ботам
 * @param props - Проект и данные большой рассылки
 * @returns JSX строка прогресса или null
 */
function CampaignProgressCounter({ projectId, campaign }: { projectId: number; campaign: BroadcastCampaign }) {
  const { totals } = useCampaignLiveProgress(projectId, campaign.id);
  const isRunning = totals?.isRunning ?? campaign.status === 'running';
  if (!isRunning) return null;

  const sent = totals?.sentCount ?? campaign.sentCount ?? 0;
  const total = totals?.totalCount || campaign.totalCount || 0;
  return <span className="text-[10px] text-blue-600 dark:text-blue-400 shrink-0">⏳ {sent}/{total}</span>;
}

/**
 * Хук превью последней рассылки проекта — текст и живой счётчик отправки.
 * Учитывает и одиночные рассылки, и рассылки сразу по нескольким ботам.
 *
 * @param props - Свойства превью
 * @returns Текст превью и элемент со счётчиком отправки
 */
export function useBroadcastRowPreview({ projectId, selectedTokenId }: BroadcastRowPreviewProps) {
  const { broadcasts } = useBroadcasts(projectId, selectedTokenId);
  const { campaigns } = useBroadcastCampaigns(projectId);

  const latest = useMemo(
    () => buildBroadcastTimeline(campaigns, broadcasts)[0],
    [campaigns, broadcasts],
  );

  if (!latest) {
    return { previewText: 'Нет рассылок', progress: null };
  }

  if (latest.kind === 'campaign') {
    return {
      previewText: toPreviewText(latest.campaign.messageText),
      progress: <CampaignProgressCounter projectId={projectId} campaign={latest.campaign} />,
    };
  }

  return {
    previewText: toPreviewText(latest.broadcast.messageText),
    progress: <SingleProgress projectId={projectId} broadcast={latest.broadcast} />,
  };
}
