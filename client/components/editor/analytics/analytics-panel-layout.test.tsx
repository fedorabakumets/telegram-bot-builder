/** @fileoverview Регрессия единственного рекламного блока при загрузке, живых снимках и смене проекта. */
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { AnalyticsV2Snapshot } from '@shared/analytics/v2';
import { afterEach, expect, it, vi } from 'vitest';
import { AnalyticsPanel } from './analytics-panel';
/** Управляемый серверный снимок; структура рабочей вкладки остаётся настоящей. */
const state = vi.hoisted(() => ({ data: undefined as AnalyticsV2Snapshot | undefined }));
vi.mock('./use-analytics-snapshot', () => ({ useAnalyticsSnapshot: () => ({ data: state.data, isError: false, isFetching: !state.data, connection: 'connected', bridgeConnected: true }) }));
vi.mock('@/hooks/use-project-tokens', () => ({ useProjectTokens: () => [{ tokens: [] }] }));
vi.mock('@/hooks/use-normalize-selected-token', () => ({ useNormalizeSelectedTokenId: () => {} }));
vi.mock('@/components/ui/scroll-area', () => ({ ScrollArea: ({ children }: { /** Содержимое области. */ children: ReactNode }) => <div>{children}</div> }));
vi.mock('./analytics-header', () => ({ AnalyticsHeader: () => <h1>Аналитика</h1> }));
vi.mock('./analytics-report-overview', () => ({ AnalyticsReportOverview: () => null, AnalyticsReportSummary: () => null }));
vi.mock('./analytics-report-chart', () => ({ AnalyticsReportChart: () => null }));
vi.mock('./analytics-report-sources', () => ({ AnalyticsReportSources: () => null }));
/** Оба списка лидеров исключены из проверки размещения рекламного раздела. */
vi.mock('./analytics-report-leaders', () => ({ AnalyticsReportLeaders: () => null, AnalyticsUserLeaders: () => null }));
vi.mock('./analytics-report-distribution', () => ({ AnalyticsReportDistribution: () => null }));
vi.mock('./analytics-access-check-panel', () => ({ AnalyticsAccessCheckPanel: () => null }));
vi.mock('./table-chart/analytics-table-chart-card', () => ({ AnalyticsTableChartCard: () => <h3>График по таблице</h3> }));
vi.mock('./use-acquisition', () => ({ useAcquisition: () => ({ data: { sources: [], placements: [], links: [], expenses: [] } }), useAcquisitionReport: () => ({ data: { rows: [] }, isError: false, isLoading: false }) }));
/** Создаёт полный пустой снимок без подмены компонентов layout и рекламного раздела. */
function snapshot(projectId = 1, revision = '1'): AnalyticsV2Snapshot {
  return { schema_version: 2, project_id: projectId, token_id: null, revision, as_of: '2026-11-01T00:00:00Z',
    range: { from: '2026-10-01T00:00:00Z', to: '2026-11-01T00:00:00Z', timezone: 'Europe/Moscow', step_ms: 86400000, period: '30d' },
    coverage: { status: 'complete', from: '2026-10-01T00:00:00Z', legacy_unknown_users: 0, bots: [], description: '' },
    current: { audience: { new_users: 0, restored_users: 0, first_history_status: 'complete', total_users: 0, active_users: 0, returning_users: 0, unknown_first_users: 0 },
      messages: { incoming: 0, incoming_to_bot: 0, outgoing: 0, callbacks: 0, historical_callbacks: 0, system: 0, total: 0, chat_scopes: { private: { incoming: 0, incoming_to_bot: 0, outgoing: 0, callbacks: 0, historical_callbacks: 0 }, group: { incoming: 0, incoming_to_bot: 0, outgoing: 0, callbacks: 0, historical_callbacks: 0 } } }, groups: { active_groups: 0, participants: 0, directed_actions: 0 } },
    previous: null, points: [], leaders: { users: [], groups: [], groups_observed: [] }, sources: [], previous_sources: null, source_points: [], buttons: [],
    availability: { available: 0, blocked: 0, deleted: 0, checked_at: null }, composition: { premium: 0, regular: 0, unknown: 0, languages: [] }, next_recompute_at: null };
}
afterEach(() => { state.data = undefined; vi.restoreAllMocks(); sessionStorage.clear(); localStorage.clear(); });
it('оставляет ровно один рекламный раздел после повторных загрузок и живых обновлений', () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
  const wrapper = ({ children }: { /** Проверяемая вкладка. */ children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const view = render(<AnalyticsPanel projectId={1} />, { wrapper });
  expect(screen.getAllByRole('heading', { name: 'Источники и реклама' })).toHaveLength(1);
  for (let revision = 1; revision <= 8; revision++) {
    state.data = snapshot(1, String(revision));
    view.rerender(<AnalyticsPanel projectId={1} selectedTokenId={revision % 2 ? 11 : null} />);
    expect(screen.getAllByRole('heading', { name: 'Источники и реклама' })).toHaveLength(1);
    expect(screen.getAllByRole('heading', { name: 'График по таблице' })).toHaveLength(1);
    state.data = undefined;
    view.rerender(<AnalyticsPanel projectId={1} />);
    expect(screen.getAllByRole('heading', { name: 'Источники и реклама' })).toHaveLength(1);
  }
  state.data = snapshot(2);
  view.rerender(<AnalyticsPanel projectId={2} />);
  expect(screen.getAllByRole('heading', { name: 'Источники и реклама' })).toHaveLength(1);
  expect(screen.getAllByRole('heading', { name: 'Аудитория и активность' })).toHaveLength(1);
  expect(errors.mock.calls.filter(args => args.some(arg => String(arg).includes('same key')))).toHaveLength(0);
  view.unmount(); client.clear();
});
