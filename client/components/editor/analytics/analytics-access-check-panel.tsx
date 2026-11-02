/**
 * @fileoverview Блок массовой проверки доступов в карточке пользователей.
 * @module client/components/editor/analytics/analytics-access-check-panel
 */
import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { isActiveChatAccessCheckStatus } from '@shared/project-sync/project-event';
import { AnalyticsAudienceReachNote } from './analytics-audience-reach-note';
import { AnalyticsAccessCheckButton } from './analytics-access-check-button';
import { AnalyticsAccessCheckProgress } from './analytics-access-check-progress';
import { useProjectTokens } from '@/hooks/use-project-tokens';
import { useChatAccessCheckJob } from './use-chat-access-check-job';
import { useChatAccessCheckLive } from './use-chat-access-check-live';
import { mergeJob } from './analytics-access-check-merge';

/**
 * Пропсы блока проверки.
 */
interface AnalyticsAccessCheckPanelProps {
  /** Показывать старую сводку; новый отчёт рисует точные показатели отдельно. */
  showSummary?: boolean;
  /** Проект. */
  projectId: number;
  /** Выбранный бот; без него блок скрыт. */
  tokenId?: number | null;
  /** Пользователи карточки — порог показа кнопки. */
  totalUsers: number;
  /** Сколько заблокировали бота. */
  blockedBotUsers?: number;
  /** Сколько с удалённым аккаунтом. */
  deletedUsers?: number;
  /** Люди, которые хотя бы раз писали в личном чате. */
  privateUsers?: number;
  /** Люди, которые хотя бы раз писали в группе или супергруппе. */
  groupUsers?: number;
  /** Люди, которые хотя бы раз писали в канале. */
  channelUsers?: number;
  /** Человек есть больше чем в одной из строк мест. */
  usersInSeveralPlaces?: number;
}

/**
 * Читает скрытый итог проверки для выбранного бота.
 * @param key - Ключ sessionStorage
 * @returns Идентификатор скрытой задачи или null
 */
function readDismissedJobId(key: string | null): number | null {
  if (!key) return null;
  const stored = Number(sessionStorage.getItem(key));
  return Number.isSafeInteger(stored) && stored > 0 ? stored : null;
}

/**
 * Показывает читаемые показатели аудитории, кнопку и живой прогресс проверки.
 * @param props - Свойства компонента
 * @returns JSX элемент или null
 */
export function AnalyticsAccessCheckPanel({
  projectId, tokenId, totalUsers, blockedBotUsers = 0, deletedUsers = 0, showSummary = true,
  privateUsers = 0, groupUsers = 0, channelUsers = 0, usersInSeveralPlaces = 0,
}: AnalyticsAccessCheckPanelProps) {
  const queryClient = useQueryClient();
  const tokens = useProjectTokens([projectId])[0]?.tokens ?? [];
  /** Локальный выбор для проверки при общей аналитике проекта. */
  const [checkTokenId, setCheckTokenId] = useState<number | null>(null);
  /** «Все боты» при одном токене — это и есть выбранный бот. */
  const selected = tokens.some(token => token.id === checkTokenId) ? checkTokenId : tokenId ?? (tokens.length === 1 ? tokens[0].id : null);
  /** При смене общей области сбрасывает локальный выбор проверки. */
  useEffect(() => { setCheckTokenId(null); }, [projectId, tokenId]);
  const dismissKey = selected ? `chat-access-dismissed:${projectId}:${selected}` : null;
  const [dismissedJobId, setDismissedJobId] = useState<number | null>(() => readDismissedJobId(dismissKey));
  const { job, start, cancel, isStarting, isCancelling } = useChatAccessCheckJob(projectId, selected);
  const { progress } = useChatAccessCheckLive(projectId, selected);
  const view = useMemo(
    () => (progress ? mergeJob(job, progress, projectId) : job),
    [job, progress, projectId],
  );
  const active = Boolean(view && isActiveChatAccessCheckStatus(view.status));
  const summaryHidden = Boolean(view && !active && dismissedJobId === view.jobId);

  useEffect(() => {
    if (!dismissKey) {
      setDismissedJobId(null);
      return;
    }
    setDismissedJobId(readDismissedJobId(dismissKey));
  }, [dismissKey]);

  useEffect(() => {
    if (!view) return undefined;
    const timer = window.setTimeout(() => {
      void queryClient.invalidateQueries({
        predicate: (query) => String(query.queryKey[0] ?? '').includes(`/projects/${projectId}/users/stats`),
      });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [view?.processedCount, view?.status, view?.kickedCount, view?.deletedCount, view, projectId, queryClient]);

  const note = showSummary ? (
    <AnalyticsAudienceReachNote
      totalUsers={totalUsers}
      blockedBotUsers={blockedBotUsers}
      deletedUsers={deletedUsers}
      privateUsers={privateUsers}
      groupUsers={groupUsers}
      channelUsers={channelUsers}
      usersInSeveralPlaces={usersInSeveralPlaces}
    />
  ) : null;
  const canCheck = totalUsers > 0 || active;
  if (!canCheck) return note;

  return (
    <div className="space-y-2">
      <div className="analytics-access-summary flex flex-wrap items-start justify-between gap-4">
        {note && <div className="min-w-0 basis-full">{note}</div>}
        {!active && (
          <AnalyticsAccessCheckButton
            tokens={tokens} selectedTokenId={selected} onSelectToken={setCheckTokenId}
            totalUsers={totalUsers}
            pending={isStarting}
            disabled={tokens.length === 0}
            onConfirm={start}
          />
        )}
      </div>
      {view && !summaryHidden && (active || view.processedCount > 0 || view.status === 'failed') && (
        <AnalyticsAccessCheckProgress
          {...view}
          cancelling={isCancelling}
          onCancel={active ? () => cancel(view.jobId) : undefined}
          onDismiss={!active ? () => {
            setDismissedJobId(view.jobId);
            if (dismissKey) sessionStorage.setItem(dismissKey, String(view.jobId));
          } : undefined}
        />
      )}
    </div>
  );
}
