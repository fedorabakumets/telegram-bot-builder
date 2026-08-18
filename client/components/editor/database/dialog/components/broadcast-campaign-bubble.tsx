/**
 * @fileoverview Пузырь большой рассылки в ленте — одна запись на все боты сразу
 * @module editor/database/dialog/components/broadcast-campaign-bubble
 */

import { useMemo, useState } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CompactInlineEditor } from '@/components/editor/inline-rich/compact-inline-editor';
import { parseHTML } from '@/components/editor/inline-rich/utils/formatting-parser';
import { useBroadcastCampaignDetail } from '@/components/editor/broadcast/hooks/use-broadcast-campaign-detail';
import { useCampaignLiveProgress } from '@/components/editor/broadcast/hooks/use-campaign-live-progress';
import { useDeleteBroadcastCampaign } from '@/components/editor/broadcast/hooks/use-delete-broadcast-campaign';
import { useEditBroadcastCampaign } from '@/components/editor/broadcast/hooks/use-edit-broadcast-campaign';
import { useStopBroadcastCampaign } from '@/components/editor/broadcast/hooks/use-stop-broadcast-campaign';
import { pluralizeBots } from '@/components/editor/broadcast/utils/format-bot-label';
import { CampaignBotsList } from './campaign-bots-list';
import { CampaignBubbleActions } from './campaign-bubble-actions';
import { CampaignBubbleMeta } from './campaign-bubble-meta';
import { BroadcastDeleteConfirm } from './broadcast-delete-confirm';
import { getCampaignStatusBadge } from '../utils/campaign-status-badge';
import type { BroadcastCampaign } from '@shared/schema';

/**
 * Пропсы компонента BroadcastCampaignBubble
 */
interface BroadcastCampaignBubbleProps {
  /** Данные большой рассылки */
  campaign: BroadcastCampaign;
  /** Идентификатор проекта */
  projectId: number;
  /** Колбэк обновления ленты рассылок */
  onRefetch?: () => void;
}

/**
 * Пузырь большой рассылки: текст сообщения, общие счётчики по всем ботам
 * и раскрываемый список ботов с их статусами. Правка текста и удаление
 * применяются сразу ко всем ботам рассылки.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент пузыря большой рассылки
 */
export function BroadcastCampaignBubble({
  campaign,
  projectId,
  onRefetch,
}: BroadcastCampaignBubbleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState(campaign.messageText ?? '');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { totals, byBroadcast } = useCampaignLiveProgress(projectId, campaign.id);
  const isLiveRunning = totals?.isRunning ?? campaign.status === 'running';
  const { broadcasts, refetch: refetchDetail } = useBroadcastCampaignDetail(
    projectId,
    campaign.id,
    expanded || isLiveRunning,
  );

  /** Общее обновление: и лента, и детали текущей рассылки */
  const refreshAll = () => {
    refetchDetail();
    onRefetch?.();
  };

  const editMutation = useEditBroadcastCampaign({ projectId, refetch: refreshAll });
  const deleteMutation = useDeleteBroadcastCampaign({ projectId, refetch: refreshAll });
  const stopMutation = useStopBroadcastCampaign({ projectId, refetch: refreshAll });

  const totalCount = totals?.totalCount || campaign.totalCount || 0;
  const failedCount = totals?.failedCount ?? campaign.failedCount ?? 0;
  const blockedCount = totals?.blockedCount ?? campaign.blockedCount ?? 0;
  const deletedCount = totals?.deletedCount ?? campaign.deletedCount ?? 0;
  const doneCount = isLiveRunning
    ? (totals?.sentCount ?? campaign.sentCount ?? 0)
    : (totals?.deliveredCount ?? campaign.deliveredCount ?? 0);
  const badge = getCampaignStatusBadge(isLiveRunning ? 'running' : campaign.status);
  const botCount = campaign.tokenIds?.length ?? broadcasts.length;

  /** Парсим HTML-текст рассылки */
  const content = useMemo(() => {
    if (!campaign.messageText?.trim()) return null;
    return parseHTML(campaign.messageText.trimEnd());
  }, [campaign.messageText]);

  /** Сохранить новый текст сразу во всех ботах */
  const handleSaveEdit = () => {
    if (!editText.trim()) return;
    editMutation.mutate({ campaignId: campaign.id, messageText: editText.trim() });
    setEditMode(false);
  };

  return (
    <div
      className="flex justify-end"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CampaignBubbleActions
        showEdit={isHovered && !editMode && !deleteMutation.isPending}
        showDelete={(isHovered || deleteMutation.isPending) && !editMode}
        isRunning={isLiveRunning}
        isDeleting={deleteMutation.isPending}
        isStopping={stopMutation.isPending}
        onStartEdit={() => { setEditText(campaign.messageText ?? ''); setEditMode(true); }}
        onStopAll={() => stopMutation.mutate(campaign.id)}
        onRequestDelete={() => setConfirmOpen(true)}
      />

      <div className="max-w-[85%] space-y-1">
        {editMode ? (
          <div className="rounded-lg px-3 py-2 bg-gradient-to-br from-violet-100 to-fuchsia-50 dark:from-violet-900/50 dark:to-fuchsia-900/30">
            <div className="flex flex-col gap-1 min-w-[260px]">
              <CompactInlineEditor value={editText} onChange={setEditText} placeholder="Текст рассылки..." />
              <p className="text-[10px] text-muted-foreground">
                Текст изменится у получателей всех {botCount} {pluralizeBots(botCount)}
              </p>
              <div className="flex gap-1 justify-end">
                <Button
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={handleSaveEdit}
                  disabled={!editText.trim() || editMutation.isPending}
                >
                  {editMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                  <span className="ml-1">Сохранить</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs"
                  onClick={() => setEditMode(false)}
                  disabled={editMutation.isPending}
                >
                  <X className="h-3 w-3" />
                  <span className="ml-1">Отмена</span>
                </Button>
              </div>
            </div>
          </div>
        ) : content && (
          <div className="rounded-lg px-3 py-2 bg-gradient-to-br from-violet-100 to-fuchsia-50 dark:from-violet-900/50 dark:to-fuchsia-900/30 text-violet-900 dark:text-violet-100">
            <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
          </div>
        )}

        {/* Мета-информация: дата, суммарные счётчики, статус */}
        <CampaignBubbleMeta
          createdAt={campaign.createdAt}
          botCount={botCount}
          isLiveRunning={isLiveRunning}
          doneCount={doneCount}
          totalCount={totalCount}
          blockedCount={blockedCount}
          deletedCount={deletedCount}
          failedCount={failedCount}
          expanded={expanded}
          onToggle={() => setExpanded((v) => !v)}
          badge={badge}
        />

        {expanded && !editMode && (
          <div className="border-t border-border/50 px-1 pt-1.5">
            <CampaignBotsList
              projectId={projectId}
              broadcasts={broadcasts}
              liveByBroadcast={byBroadcast}
              onRefetch={refreshAll}
            />
          </div>
        )}
      </div>

      <BroadcastDeleteConfirm
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        botCount={botCount}
        onConfirm={() => deleteMutation.mutate(campaign.id)}
      />
    </div>
  );
}
