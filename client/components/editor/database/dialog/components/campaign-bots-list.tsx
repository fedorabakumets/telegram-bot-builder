/**
 * @fileoverview Раскрываемый список ботов большой рассылки с ошибками доставки
 * @module editor/database/dialog/components/campaign-bots-list
 */

import { useState } from 'react';
import { useProjectTokens } from '@/hooks/use-project-tokens';
import { formatBotShortLabel } from '@/components/editor/broadcast/utils/format-bot-label';
import { CampaignBotRow } from './campaign-bot-row';
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

/**
 * Список ботов большой рассылки: карточки прогресса и раскрываемые ошибки
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
  /** ID раскрытой рассылки (показать ошибки) */
  const [openBroadcastId, setOpenBroadcastId] = useState<number | null>(null);

  if (broadcasts.length === 0) {
    return <p className="px-1 text-xs text-muted-foreground">Данные по ботам загружаются…</p>;
  }

  return (
    <div className="space-y-1.5">
      {broadcasts.map((item) => (
        <CampaignBotRow
          key={item.id}
          projectId={projectId}
          item={item}
          live={liveByBroadcast.get(item.id)}
          botLabel={formatBotShortLabel(tokens.find((token) => token.id === item.tokenId), item.tokenId)}
          isOpen={openBroadcastId === item.id}
          onToggle={() => setOpenBroadcastId(openBroadcastId === item.id ? null : item.id)}
          onDeleteBroadcast={onDeleteBroadcast}
          deletingBroadcastId={deletingBroadcastId}
        />
      ))}
    </div>
  );
}
