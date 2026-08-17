/**
 * @fileoverview Пузырь сообщения рассылки с кнопками удаления и редактирования при наведении
 * @module editor/database/dialog/components/broadcast-message-bubble
 */

import { useMemo, useState } from 'react';
import { parseHTML } from '@/components/editor/inline-rich/utils/formatting-parser';
import { BroadcastDeliveryErrors } from '@/components/editor/broadcast/components/broadcast-delivery-errors';
import { useBroadcastLiveProgress } from '@/components/editor/broadcast/hooks/use-broadcast-live-progress';
import { getCampaignStatusBadge } from '../utils/campaign-status-badge';
import { BroadcastBubbleActions } from './broadcast-bubble-actions';
import { BroadcastBubbleEditForm } from './broadcast-bubble-edit-form';
import { CampaignBubbleMeta } from './campaign-bubble-meta';
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
  /** Колбэк повтора рассылки (открывает wizard с тем же текстом) */
  onRepeat?: (broadcastId: number) => void;
  /** Колбэк редактирования рассылки */
  onEdit?: (broadcastId: number, newText: string) => void;
  /** Идёт ли редактирование этой рассылки */
  isEditing?: boolean;
}

/**
 * Пузырь одиночной рассылки: текст, те же чипы статистики, что у большой рассылки,
 * и раскрываемый список ошибок доставки.
 * @param props - Свойства компонента
 * @returns JSX элемент пузыря рассылки
 */
export function BroadcastMessageBubble({
  broadcast,
  projectId,
  onDelete,
  isDeleting,
  onEdit,
  isEditing,
}: BroadcastMessageBubbleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [editText, setEditText] = useState(broadcast.messageText ?? '');
  const { progressEvent } = useBroadcastLiveProgress(projectId, broadcast.id);

  const liveStatus = progressEvent?.status ?? broadcast.status;
  const isRunning = liveStatus === 'running';
  const totalCount = progressEvent?.totalCount ?? broadcast.totalCount ?? 0;
  const doneCount = isRunning
    ? (progressEvent?.sentCount ?? broadcast.sentCount ?? 0)
    : (progressEvent?.deliveredCount ?? broadcast.deliveredCount ?? 0);
  const failedCount = progressEvent?.failedCount ?? broadcast.failedCount ?? 0;
  const blockedCount = progressEvent?.blockedCount ?? broadcast.blockedCount ?? 0;
  const deletedCount = progressEvent?.deletedCount ?? broadcast.deletedCount ?? 0;
  const problemCount = failedCount + blockedCount + deletedCount;
  const badge = getCampaignStatusBadge(liveStatus);

  const content = useMemo(() => {
    if (!broadcast.messageText?.trim()) return null;
    return parseHTML(broadcast.messageText.trimEnd());
  }, [broadcast.messageText]);

  return (
    <div
      className="flex justify-end"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <BroadcastBubbleActions
        showEdit={!!onEdit && isHovered && !isDeleting && !editMode}
        showDelete={!!onDelete && (isHovered || !!isDeleting) && !editMode}
        isDeleting={!!isDeleting}
        onStartEdit={() => { setEditText(broadcast.messageText ?? ''); setEditMode(true); }}
        onDelete={() => onDelete?.(broadcast.id)}
      />

      <div className="max-w-[85%] space-y-1">
        {editMode ? (
          <BroadcastBubbleEditForm
            value={editText}
            onChange={setEditText}
            onSave={() => {
              if (!editText.trim() || !onEdit) return;
              onEdit(broadcast.id, editText.trim());
              setEditMode(false);
            }}
            onCancel={() => { setEditMode(false); setEditText(broadcast.messageText ?? ''); }}
            isSaving={isEditing}
          />
        ) : content && (
          <div className="rounded-lg bg-gradient-to-br from-violet-100 to-fuchsia-50 px-3 py-2 text-violet-900 dark:from-violet-900/50 dark:to-fuchsia-900/30 dark:text-violet-100">
            <p className="whitespace-pre-wrap break-words text-sm">{content}</p>
          </div>
        )}

        <CampaignBubbleMeta
          createdAt={broadcast.createdAt}
          isLiveRunning={isRunning}
          doneCount={doneCount}
          totalCount={totalCount}
          blockedCount={blockedCount}
          deletedCount={deletedCount}
          failedCount={failedCount}
          expanded={expanded}
          onToggle={() => { if (!editMode) setExpanded((v) => !v); }}
          badge={badge}
          disabled={editMode}
        />

        {expanded && !editMode && (
          <div className="border-t border-border/50 px-1 pt-1.5">
            <BroadcastDeliveryErrors
              projectId={projectId}
              broadcastId={broadcast.id}
              enabled={expanded}
              compact
              liveFailedCount={problemCount}
            />
          </div>
        )}
      </div>
    </div>
  );
}
