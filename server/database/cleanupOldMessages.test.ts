/** @fileoverview Проверки пересчёта срока хранения в пакетах очистки без подключения к базе. */

import { afterEach, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';

const mocks = vi.hoisted(() => ({ select: vi.fn(), execute: vi.fn(), where: vi.fn() }));
vi.mock('./db', () => ({ db: { select: mocks.select, execute: mocks.execute } }));

import { startMessagesCleanupTimer, stopMessagesCleanupTimer } from './cleanupOldMessages';

afterEach(() => {
  stopMessagesCleanupTimer();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

it('удаляет только для ограниченного срока и заново проверяет его в каждом пакете', async () => {
  vi.useFakeTimers();
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  mocks.select.mockReturnValue({ from: () => ({ innerJoin: () => ({ where: mocks.where }) }) });
  mocks.where.mockResolvedValue([{ id: 77, days: 30 }, { id: 88, days: 0 }]);
  mocks.execute.mockResolvedValueOnce({ rowCount: 5000 }).mockResolvedValue({ rowCount: 0 });

  startMessagesCleanupTimer();
  await vi.advanceTimersByTimeAsync(120_000);

  const dialect = new PgDialect();
  const selection = dialect.sqlToQuery(mocks.where.mock.calls[0][0]);
  expect(selection.sql).toContain('"bot_tokens"."inherit_bot_settings"');
  expect(selection.sql).toContain('"bot_projects"."bot_setting_defaults"');
  expect(selection.sql).toContain('else "bot_tokens"."messages_retention_days"');
  expect(selection.params[selection.params.length - 1]).toBe(0);
  expect(mocks.execute).toHaveBeenCalledTimes(2);
  for (const [statement] of mocks.execute.mock.calls) {
    const deletion = dialect.sqlToQuery(statement);
    expect(deletion.sql).toMatch(/DELETE FROM bot_messages[\s\S]*AND EXISTS[\s\S]*"bot_setting_defaults"/);
    expect(deletion.params.slice(0, 3)).toEqual([77, 30, 77]);
    expect(deletion.params.slice(-2)).toEqual([30, 5000]);
  }
});
