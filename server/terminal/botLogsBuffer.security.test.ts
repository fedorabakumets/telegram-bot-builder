/** @fileoverview Проверка постоянных шаблонов логирования без внешней базы и фоновых таймеров. */
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ insert: vi.fn() }));
vi.mock('../database/db', () => ({ db: { insert: mocks.insert } }));
vi.mock('@shared/schema', () => ({ botLogs: {} }));
vi.mock('../database/cleanupOldLogs', () => ({
  startLogsCleanupTimer: vi.fn(), stopLogsCleanupTimer: vi.fn(),
}));
vi.mock('../database/cleanupOldMessages', () => ({
  startMessagesCleanupTimer: vi.fn(), stopMessagesCleanupTimer: vi.fn(),
}));

import { addToBuffer, flushBuffer, persistLogLine } from './botLogsBuffer';

afterEach(() => { vi.restoreAllMocks(); mocks.insert.mockReset(); });

describe('Безопасное форматирование буфера логов', () => {
  /** Не позволяет содержимому ошибки стать шаблоном форматирования консоли. */
  it('передаёт ключ и ошибку отдельно от постоянного шаблона', async () => {
    const failure = new Error('Ошибка %s %j');
    mocks.insert.mockImplementation(() => { throw failure; });
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    addToBuffer(27, 47, 'Содержимое %s %j', 'stderr');
    await flushBuffer('27_47');
    expect(error).toHaveBeenCalledExactlyOnceWith(
      '[BotLogsBuffer] Ошибка сброса буфера для %s:', '27_47', failure,
    );
  });

  /** Отбрасывает некорректные идентификаторы до обращения к хранилищу. */
  it('не обращается к базе для неверных идентификаторов', async () => {
    for (const [projectId, tokenId] of [[0, 47], [-1, 47], [27, 0], [NaN, 47]]) {
      expect(await persistLogLine(projectId, tokenId, 'тест', 'stdout')).toBeUndefined();
      addToBuffer(projectId, tokenId, 'тест', 'stdout');
      await flushBuffer(`${projectId}_${tokenId}`);
    }
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});
