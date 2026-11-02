/** @fileoverview Показатели сообщений и уникальных собеседников за выбранный период графика. */
import { useUsersActivity } from '@/components/editor/database/user-database/hooks/queries/use-users-activity';
import type { Granularity } from '@/components/editor/database/user-database/hooks/queries/use-messages-activity';
import { AnalyticsAudienceSummary } from './analytics-audience-summary';

/**
 * Показывает итоги направлений и уникальных людей без суммирования уникальных значений слотов.
 * @param props - Область, период и суммы сырых точек графика.
 * @returns Сводка с состояниями загрузки и ошибки.
 */
export function AnalyticsMessageSummary({ projectId, selectedTokenId, granularity, incoming, outgoing, loading, error }: {
  /** Открытый проект. */
  projectId: number;
  /** Выбранный бот или весь проект. */
  selectedTokenId?: number | null;
  /** Тот же период, что у графика сообщений. */
  granularity: Granularity;
  /** Входящие за выбранное окно. */
  incoming: number;
  /** Исходящие и служебные за выбранное окно. */
  outgoing: number;
  /** Загружаются направления сообщений. */
  loading: boolean;
  /** Не удалось загрузить направления. */
  error: boolean;
}) {
  const users = useUsersActivity({ projectId, selectedTokenId, granularity, liveOnly: true });
  if (loading || users.isLoading) return <div aria-label="Загрузка итогов сообщений" aria-busy="true" className="grid grid-cols-3 gap-4">
    {[0, 1, 2].map(key => <div key={key} className="h-16 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />)}
  </div>;
  if (error || users.isError) return <p role="alert" className="text-sm text-muted-foreground">Не удалось загрузить итоги периода. Нажмите «Обновить» в шапке страницы.</p>;
  return <div className="space-y-4">
    <AnalyticsAudienceSummary title="Сообщения за выбранный период" items={[
      { label: 'Входящие', value: incoming, className: 'text-emerald-500' },
      { label: 'Исходящие и служебные', value: outgoing, className: 'text-indigo-500' },
      { label: 'Написали боту', value: users.activeInWindow, className: 'text-sky-500' },
    ]} />
    <p className="text-sm text-muted-foreground [text-wrap:pretty]">За выбранный период. «Написали боту» учитывает уникальных людей с входящими сообщениями. Служебные записи включены в исходящие.</p>
  </div>;
}
