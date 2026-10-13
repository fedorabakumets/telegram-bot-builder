/**
 * @fileoverview Тесты подтверждения массовой правки навигации через API
 * @module lib/bot-tools/scenario-navigation-db.test
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { rewriteButtonNavigationInDb } from './scenario-navigation-db.ts';

const fetchMock = vi.fn();

vi.mock('./api-fetch.ts', () => ({
  apiFetch: (...args: unknown[]) => fetchMock(...args),
}));

/**
 * Создаёт минимальный проект с кнопочным переходом.
 * @returns HTTP-ответ с тестовым project.json
 */
function projectResponse(): Response {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      data: {
        version: 2,
        activeSheetId: 'main',
        sheets: [{
          id: 'main',
          name: 'Главная',
          nodes: [
            {
              id: 'kb',
              type: 'keyboard',
              position: { x: 0, y: 0 },
              data: {
                keyboardType: 'inline',
                buttons: [{ id: 'b', text: 'Экран', action: 'goto', target: 'screen' }],
              },
            },
            {
              id: 'screen',
              type: 'message',
              position: { x: 200, y: 0 },
              data: { messageText: 'Экран' },
            },
          ],
        }],
      },
    }),
  } as Response;
}

describe('rewriteButtonNavigationInDb', () => {
  beforeEach(() => fetchMock.mockReset());

  it('без confirm читает план, но не отправляет PUT', async () => {
    fetchMock.mockResolvedValue(projectResponse());
    const result = await rewriteButtonNavigationInDb(14, 'edit_current', false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1]?.method).toBeUndefined();
    expect(result).toMatchObject({ applied: false, requiresConfirmation: true, changed: 1 });
  });

  it('с confirm записывает проект одним PUT', async () => {
    fetchMock.mockResolvedValueOnce(projectResponse()).mockResolvedValueOnce({
      ok: true,
      status: 200,
    });
    const result = await rewriteButtonNavigationInDb(14, 'edit_current', true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][1]?.method).toBe('PUT');
    expect(result).toMatchObject({ applied: true, changed: 1 });
  });
});
