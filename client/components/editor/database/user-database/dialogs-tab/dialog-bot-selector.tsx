/** @fileoverview Выбор бота в диалогах с подтверждённой аудиторией из общего снимка аналитики. */
import { useMemo } from 'react';
import type { BotToken } from '@shared/schema';
import { BotTokenSelector } from '../components/header/bot-token-selector';
import { useAnalyticsSnapshot } from '@/components/editor/analytics/use-analytics-snapshot';
import { initialReportFilter } from '@/components/editor/analytics/analytics-report-filter';

/** Параметры выбора конкретного бота для переписки. */
interface DialogBotSelectorProps {
  /** Открытый проект. */ projectId: number;
  /** Боты проекта. */ tokens: BotToken[];
  /** Выбранный бот. */ selectedTokenId: number | null;
  /** Обработчик выбора бота. */ onSelect: (id: number | null) => void;
  /** Совместимость с вызовами селектора конкретного бота. */ allowAll?: false;
}

/**
 * Показывает такие же числа аудитории, как селектор аналитики.
 * @param props - Проект, боты и обработчик выбора.
 * @returns Селектор с подтверждённой аудиторией без счётчика сохранённых профилей.
 */
export function DialogBotSelector(props: DialogBotSelectorProps) {
  const filter = useMemo(() => initialReportFilter(props.projectId), [props.projectId]);
  const snapshot = useAnalyticsSnapshot(props.projectId, null, filter);
  /** При ошибке или смене проекта не подставляет чужие либо устаревшие счётчики. */
  const counts = useMemo(() => new Map(
    !snapshot.isError && snapshot.data?.project_id === props.projectId
      ? snapshot.data.token_audiences?.map(item => [item.token_id, item.total_users] as const) ?? []
      : [],
  ), [props.projectId, snapshot.data, snapshot.isError]);
  return <BotTokenSelector {...props} allowAll={false} audienceCounts={counts} />;
}
