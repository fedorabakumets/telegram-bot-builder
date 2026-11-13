/** @fileoverview Проверки причины отключения токена в безопасном списке проекта. */
import assert from 'node:assert/strict';
import test from 'node:test';
import type { BotToken } from '@shared/schema';
import { toBotTokenListItem } from './bot-token-list-dto';

test('список отличает отказ Telegram от ручного отключения и не раскрывает секрет', () => {
  const invalid = toBotTokenListItem({ id: 58, isActive: 0, authorizationError: 'unauthorized', token: 'secret' } as BotToken);
  assert.equal(invalid.authorizationError, 'unauthorized');
  assert.ok(!JSON.stringify(invalid).includes('secret'));
  const disabled = toBotTokenListItem({ id: 58, isActive: 0, authorizationError: null } as BotToken);
  assert.equal(disabled.authorizationError, null);
});
