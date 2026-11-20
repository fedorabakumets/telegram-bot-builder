/**
 * @fileoverview Пузырь сообщения рассылки с кнопками удаления и редактирования при наведении
 * @module editor/database/dialog/components/broadcast-message-bubble
 */

import { useMemo, useState } from 'react';
import { parseHTML } from '@/components/editor/inline-rich/utils/formatting-parser';
import { MediaPreviewList } from '@/components/editor/broadcast/components/media-preview';
import { BroadcastDeliveryErrors } from '@/components/editor/broadcast/components/broadcast-delivery-errors';
import { BroadcastUnauthorizedHint } from '@/components/editor/broadcast/components/broadcast-unauthorized-hint';
import { useBroadcastLiveProgress } from '@/components/editor/broadcast/hooks/use-broadcast-live-progress';
import { getCampaignStatusBadge } from '../utils/campaign-status-badge';
import { BroadcastBubbleActions } from './broadcast-bubble-actions';
import { BroadcastBubbleEditForm } from './broadcast-bubble-edit-form';
import { CampaignBubbleMeta } from './campaign-bubble-meta';
import { BroadcastKeyboardPreview } from './broadcast-keyboard-preview';
import type { Broadcast } from '@shared/schema';

/**
 * Пропсы компонента BroadcastMessageBubble
 */
interface BroadcastMessageBubbleProps {
  /** Данные рассылки */
  broadcast: Broadcast;
  /** Идентификатор проекта */
  projectId: number;
  /** Колбэк удаления рассылки */
  onDelete?: (broadcastId: number) => void;
  /** Идёт ли удаление этой рассылки */
  isDeleting?: boolean;
  /** Колбэк повтора рассылки: открывает форму с исходным текстом и вложениями */
  onRepeat?: (broadcastId: number) => void;
  /** Колбэк редактирования рассылки */
  onEdit?: (broadcastId: number, newText: string) => Promise<boolean>;
  /** Идёт ли редактирование этой рассылки */
  isEditing?: boolean;
}

/**
 * Пузырь одиночной рассылки: текст, вложения, повтор и чипы статистики,
 * и раскрываемый список ошибок доставки.
 * @param props - Свойства компонента
 * @returns JSX элемент пузыря рассылки
 */
export function BroadcastMessageBubble({
  broadcast,
  projectId,
  onRepeat,
  onDelete,
  isDeleting,
  onEdit,
  isEditing,
}: BroadcastMessageBubbleProps) {
  const [editMode, setEditMode] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [editText, setEditText] = useState(broadcast.messageText ?? '');
  const { progressEvent } = useBroadcastLiveProgress(projectId, broadcast.id);

  const liveStatus = progressEvent?.status ?? broadcast.status;
  const isRunning = liveStatus === 'running';
  const totalCount = progressEvent?.totalCount ?? broadcast.totalCount ?? 0;
  const processedCount = progressEvent?.sentCount ?? broadcast.sentCount ?? 0;
  const deliveredCount = progressEvent?.deliveredCount ?? broadcast.deliveredCount ?? 0;
  const failedCount = progressEvent?.failedCount ?? broadcast.failedCount ?? 0;
  const blockedCount = progressEvent?.blockedCount ?? broadcast.blockedCount ?? 0;
  const deletedCount = progressEvent?.deletedCount ?? broadcast.deletedCount ?? 0;
  const problemCount = failedCount + blockedCount + deletedCount;
  const tokenInvalid = progressEvent?.abortReason === 'unauthorized';
  const badge = getCampaignStatusBadge(liveStatus);

  const content = useMemo(() => {
    if (!broadcast.messageText?.trim()) return null;
    return parseHTML(broadcast.messageText.trimEnd());
  }, [broadcast.messageText]);

  return (
    /** Действия доступны постоянно и не меняют расположение при наведении. */
    <div className="flex justify-end">
      <BroadcastBubbleActions
        showRepeat={!!onRepeat && !isDeleting && !editMode}
        onRepeat={() => onRepeat?.(broadcast.id)}
        showEdit={!!onEdit && !isDeleting && !editMode}
        showDelete={!!onDelete && !editMode}
        isDeleting={!!isDeleting}
        onStartEdit={() => { setEditText(broadcast.messageText ?? ''); setEditMode(true); }}
        onDelete={() => onDelete?.(broadcast.id)}
      />

      <div className="max-w-[85%] space-y-1">
        {editMode ? (
          <BroadcastBubbleEditForm
            value={editText}
            onChange={setEditText}
            onSave={async () => {
              if (!editText.trim() || !onEdit) return;
              const saved = await onEdit(broadcast.id, editText.trim());
              if (saved) setEditMode(false);
            }}
            onCancel={() => { setEditMode(false); setEditText(broadcast.messageText ?? ''); }}
            isSaving={isEditing}
          />
        ) : (content || (broadcast.mediaUrls?.length ?? 0) > 0) && (
          <div className="rounded-lg bg-gradient-to-br from-violet-100 to-fuchsia-50 px-3 py-2 text-violet-900 dark:from-violet-900/50 dark:to-fuchsia-900/30 dark:text-violet-100">
            <MediaPreviewList mediaUrls={broadcast.mediaUrls ?? []} projectId={projectId} tokenId={broadcast.tokenId} compact />
            {content && <p className="whitespace-pre-wrap break-words text-sm">{content}</p>}
          </div>
        )}

        {/* Сохранённая клавиатура видна и при просмотре, и при правке текста. */}
        <BroadcastKeyboardPreview buttons={broadcast.buttons} buttonsPerRow={broadcast.buttonsPerRow} broadcastId={broadcast.id} />
        <CampaignBubbleMeta
          createdAt={broadcast.createdAt}
          isLiveRunning={isRunning}
          processedCount={processedCount}
          deliveredCount={deliveredCount}
          totalCount={totalCount}
          blockedCount={blockedCount}
          deletedCount={deletedCount}
          failedCount={failedCount}
          expanded={expanded}
          onToggle={() => { if (!editMode) setExpanded((v) => !v); }}
          badge={badge}
          disabled={editMode}
        />
        {tokenInvalid && !expanded && (
          <div className="px-1">
            <BroadcastUnauthorizedHint />
          </div>
        )}

        {expanded && !editMode && (
          <div className="border-t border-border/50 px-1 pt-1.5">
            <BroadcastDeliveryErrors
              projectId={projectId}
              broadcastId={broadcast.id}
              enabled={expanded}
              compact
              liveFailedCount={tokenInvalid ? Math.max(problemCount, 1) : problemCount}
            />
          </div>
        )}
      </div>
    </div>
  );
}
