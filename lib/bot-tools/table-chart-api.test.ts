/** @fileoverview Проверка отказа в доступе и параметров маршрута графика. */
import { describe, expect, it, vi } from 'vitest';
import express from 'express';
import type { Pool } from 'pg';
import { setupTableChartRoutes } from '../../server/routes/tables/chart/setup-table-chart-routes';

/**
 * Поднимает маршрут на свободном порту.
 * @param access - Проверка доступа.
 * @param connect - Подключение к базе.
 * @returns Адрес и функция остановки.
 */
async function listen(access: express.RequestHandler, connect: ReturnType<typeof vi.fn>) {
  const app = express();
  setupTableChartRoutes(app, (_req, _res, next) => next(), access, { connect } as unknown as Pool);
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  const address = server.address() as { port: number };
  return { port: address.port, close: () => new Promise<void>(resolve => server.close(() => resolve())) };
}

describe('Маршрут графика таблицы', () => {
  it('не открывает базу при отказе в доступе', async () => {
    const connect = vi.fn();
    const server = await listen((_req, res) => { res.status(403).json({ message: 'Нет доступа' }); }, connect);
    try {
      const response = await fetch(`http://127.0.0.1:${server.port}/api/projects/7/tables/1/chart?xColumnId=2&yColumnId=3`);
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ message: 'Нет доступа' });
      expect(connect).not.toHaveBeenCalled();
    } finally { await server.close(); }
  });
  it('отклоняет некорректные параметры до обращения к базе', async () => {
    const connect = vi.fn();
    const server = await listen((_req, _res, next) => next(), connect);
    try {
      const response = await fetch(`http://127.0.0.1:${server.port}/api/projects/7/tables/1/chart?xColumnId=2`);
      expect(response.status).toBe(400);
      expect(JSON.stringify(await response.json())).not.toContain('select');
      expect(connect).not.toHaveBeenCalled();
    } finally { await server.close(); }
  });
});
