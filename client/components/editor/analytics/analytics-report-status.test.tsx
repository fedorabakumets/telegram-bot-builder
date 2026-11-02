/** @fileoverview Стабильный статус снимка при частых фоновых обновлениях. */
import '@testing-library/jest-dom/vitest';
import {render,screen} from '@testing-library/react';
import {expect,it} from 'vitest';
import type {AnalyticsV2Snapshot} from '@shared/analytics/v2';
import {AnalyticsReportStatus} from './analytics-report-status';
it('не заменяет время снимка загрузкой при фоновом обновлении',()=>{
  const snapshot={as_of:'2026-11-02T06:00:00Z',range:{from:'2026-10-03T06:00:00Z',to:'2026-11-02T06:00:00Z',timezone:'Europe/Moscow'},coverage:{status:'complete'}} as AnalyticsV2Snapshot;
  const view=render(<AnalyticsReportStatus snapshot={snapshot} fetching={false} connection="connected" bridgeConnected={true}/>);
  const original=screen.getByRole('status').textContent;
  view.rerender(<AnalyticsReportStatus snapshot={snapshot} fetching={true} connection="connected" bridgeConnected={true}/>);
  expect(screen.getByRole('status').textContent).toBe(original);
  expect(screen.queryByText('Обновляем данные…')).not.toBeInTheDocument();
  expect(screen.getByText('Живые обновления подключены')).toBeInTheDocument();
});
