/** @fileoverview Пара рейтингов с общим периодом графика сообщений и обновлением через общий сокет. */
import { useQuery } from '@tanstack/react-query';
import type { ActivityLeaders } from '@shared/analytics/activity-leaders';
import type { Granularity } from '@/components/editor/database/user-database/hooks/queries/use-messages-activity';
import { AnalyticsPeriodControl } from './analytics-chart-controls';
import { AnalyticsLeadersCard } from './analytics-leaders-card';

/** Параметры общего периода и области рейтингов. */
interface Props {
  /** Открытый проект. */
  projectId: number;
  /** Бот либо весь проект. */
  tokenId?: number | null;
  /** Период графика сообщений. */
  period: Granularity;
  /** Общий выбор периода. */
  onPeriodChange: (period: Granularity) => void;
}
/**
 * Загружает оба рейтинга одним запросом без опроса и старых данных другого периода.
 * @param props - Проект, бот и общий период.
 * @returns Две адаптивные карточки и общий переключатель.
 */
export function AnalyticsLeadersPair({ projectId, tokenId, period, onPeriodChange }: Props) {
  const query = useQuery<ActivityLeaders>({
    queryKey: ['activity-leaders', projectId, tokenId ?? null, period],
    queryFn: async () => {
      const params = new URLSearchParams({ granularity: period });
      if (tokenId != null) params.set('tokenId', String(tokenId));
      const response = await fetch(`/api/projects/${projectId}/analytics/activity-leaders?${params}`, { credentials: 'include', cache: 'no-store' });
      if (!response.ok) throw new Error('Не удалось получить рейтинги');
      return response.json();
    },
    enabled: projectId > 0, staleTime: 0, refetchInterval: false, retry: false,
  });
  return <div className="space-y-4">
    <AnalyticsPeriodControl value={period} onChange={onPeriodChange} />
    <div className="analytics-grid grid grid-cols-1 gap-4">
      <AnalyticsLeadersCard title="Топ пользователей" items={query.data?.users ?? []} loading={query.isLoading} error={query.isError} />
      <AnalyticsLeadersCard title="Топ групп" items={query.data?.groups ?? []} loading={query.isLoading} error={query.isError} />
    </div>
  </div>;
}
