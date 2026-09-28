/**
 * @fileoverview Юнит-тесты формата токена для db_add_bot_token
 * @module lib/bot-tools/bot-token-create-db.test
 */

import { describe, expect, it } from 'vitest';
import { isTelegramBotTokenFormat } from './bot-token-create-db.ts';

describe('isTelegramBotTokenFormat', () => {
  it('принимает типичный токен BotFather', () => {
    expect(
      isTelegramBotTokenFormat('7123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsawX'),
    ).toBe(true);
  });

  it('отклоняет пустую строку и мусор', () => {
    expect(isTelegramBotTokenFormat('')).toBe(false);
    expect(isTelegramBotTokenFormat('not-a-token')).toBe(false);
    expect(isTelegramBotTokenFormat('123:short')).toBe(false);
  });
});
