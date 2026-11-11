/** @fileoverview Выбор бота во вкладке пользователей с подтверждённой аудиторией из аналитики. */
import { useMemo, type ComponentProps } from 'react';
import { BotTokenSelector } from './bot-token-selector';
import { useAnalyticsSnapshot } from '@/components/editor/analytics/use-analytics-snapshot';
import { initialReportFilter } from '@/components/editor/analytics/analytics-report-filter';

/** Параметры общего селектора без возможности подменить подтверждённые счётчики. */
type UsersBotSelectorProps = Omit<ComponentProps<typeof BotTokenSelector>, 'audienceCounts'>;

/**
 * Подставляет те же счётчики и сортировку ботов, что используются в аналитике.
 * @param props - Проект, доступные боты и обработчик выбора.
 * @returns Селектор ботов с подтверждённой аудиторией либо без числа во время загрузки и ошибки.
 */
export function UsersBotSelector(props: UsersBotSelectorProps): React.JSX.Element {
  const filter = useMemo(() => initialReportFilter(props.projectId), [props.projectId]);
  const snapshot = useAnalyticsSnapshot(props.projectId, null, filter);
  /** Не показывает данные другого проекта и не заменяет ошибку числом сохранённых профилей. */
  const counts = useMemo(() => new Map(
    !snapshot.isError && !snapshot.isPlaceholderData && snapshot.data?.project_id === props.projectId
      ? snapshot.data.token_audiences?.map(item => [item.token_id, item.total_users] as const) ?? []
      : [],
  ), [props.projectId, snapshot.data, snapshot.isError, snapshot.isPlaceholderData]);
  return <BotTokenSelector {...props} audienceCounts={counts} />;
}
