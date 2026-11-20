/** @fileoverview Проверки области подсчёта ботов без чтения секретов и запросов для пустого списка. */
import { beforeEach, expect, it, vi } from 'vitest';
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock('../../database/db', () => ({ pool: { query } }));
import { getProjectBotCounts } from '../projectRoutes/project-bot-counts';
beforeEach(() => query.mockReset());
/** Не запрашивает общую таблицу, если у пользователя нет доступных проектов. */
it('не выполняет запрос для пустого разрешённого списка', async () => {
  expect((await getProjectBotCounts([])).size).toBe(0);
  expect(query).not.toHaveBeenCalled();
});
/** Подсчёт ограничен только идентификаторами из уже проверенного списка. */
it('считает только переданные проекты одним агрегатным запросом', async () => {
  query.mockResolvedValue({ rows: [{ project_id: 12, count: 37 }] });
  const result = await getProjectBotCounts([12, 13]);
  expect(result.get(12)).toBe(37);
  expect(query.mock.calls[0][1]).toEqual([[12, 13]]);
  expect(query.mock.calls[0][0]).toContain('project_id=ANY($1::integer[])');
  expect(query).toHaveBeenCalledTimes(1);
});
