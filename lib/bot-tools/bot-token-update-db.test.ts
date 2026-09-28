/**
 * @fileoverview Юнит-тесты валидации для db_update_bot_token
 * @module lib/bot-tools/bot-token-update-db.test
 */

import { describe, expect, it } from 'vitest';
import { isTelegramBotTokenFormat } from './bot-token-create-db.ts';
import { updateBotTokenInDb } from './bot-token-update-db.ts';

describe('db_update_bot_token validation', () => {
  it('переиспользует isTelegramBotTokenFormat', () => {
    expect(
      isTelegramBotTokenFormat('7123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsawX'),
    ).toBe(true);
    expect(isTelegramBotTokenFormat('bad')).toBe(false);
  });

  it('отклоняет пустой и неверный token до запроса', async () => {
    expect(await updateBotTokenInDb(1, 2, '')).toEqual({
      error: 'Поле token обязательно',
    });
    const bad = await updateBotTokenInDb(1, 2, 'not-a-token');
    expect(bad).toHaveProperty('error');
    expect((bad as { error: string }).error).toMatch(/формат токена/i);
  });
});
