/** @fileoverview Узкие проверки доступа, периода, области и восстановления рейтингов. */
import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import type { Pool } from 'pg';
import { setupActivityLeaders } from '../../server/routes/analytics/setup-activity-leaders';
import { isMessageActivityQuery, subscribeMessageActivity } from '../../client/components/editor/analytics/message-activity-live';
import { QueryClient } from '@tanstack/react-query';
import { request } from 'node:http';

/** Получает HTTP статус через настоящий локальный транспорт без глобального мока fetch. */
function status(url: string, access = false): Promise<number | undefined> {
  return new Promise((resolve, reject) => {
    const req = request(url, { headers: access ? { 'x-test-access': 'yes' } : {} }, response => {
      response.resume(); response.on('end', () => resolve(response.statusCode));
    });
    req.on('error', reject); req.end();
  });
}

describe('API рейтингов', () => {
  /** Настоящий HTTP проверяет middleware раньше доступа к базе и строгие параметры. */
  it('защищает доступ и отклоняет неизвестный период и чужой токен', async () => {
    const query = vi.fn().mockResolvedValue({ rowCount: 0, rows: [] });
    const app = express();
    setupActivityLeaders(app, { query } as unknown as Pool, (req, res, next) => {
      if (req.headers['x-test-access'] !== 'yes') { res.sendStatus(403); return; } next();
    });
    const server = app.listen(0);
    try {
      const address = server.address() as { port: number };
      const url = `http://127.0.0.1:${address.port}/api/projects/12/analytics/activity-leaders`;
      expect(await status(url)).toBe(403);
      expect(query).not.toHaveBeenCalled();
      expect(await status(`${url}?granularity=unknown`, true)).toBe(400);
      expect(query).not.toHaveBeenCalled();
      expect(await status(`${url}?tokenId=99`, true)).toBe(403);
      expect(query.mock.calls[0][1]).toEqual([99, 12]);
    } finally { server.close(); }
  });
});
describe('сокет рейтингов', () => {
  /** Очистка, обновление имени и reconnect восстанавливают только текущую область. */
  it('выбирает все периоды текущего рейтинга и отписывается', () => {
    expect(isMessageActivityQuery(['activity-leaders', 12, null, '1d'], 12, null)).toBe(true);
    expect(isMessageActivityQuery(['activity-leaders', 12, 2, '1d'], 12, 1)).toBe(false);
    vi.useFakeTimers();
    const client = new QueryClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    let emit!: (event: { type: string; projectId: number; tokenId?: number }) => void;
    let reconnect!: () => void;
    const off = vi.fn();
    const dispose = subscribeMessageActivity(client, 12, null, listener => { emit = listener; return off; }, listener => { reconnect = listener; return off; });
    emit({ type: 'new-user', projectId: 12, tokenId: 2 });
    vi.advanceTimersByTime(150);
    expect(invalidate).toHaveBeenCalledTimes(1);
    reconnect();
    expect(invalidate).toHaveBeenCalledTimes(2);
    dispose(); reconnect();
    expect(invalidate).toHaveBeenCalledTimes(2);
    expect(off).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
