/**
 * @fileoverview Ключ запроса статусов ботов проекта
 * @module editor/bot/project-bot-statuses-query.test
 */

import { describe, expect, it } from 'vitest';
import { isBotStatusQueryKey, projectBotStatusesQueryKey } from './project-bot-statuses-query';

describe('projectBotStatusesQueryKey', () => {
  it('совпадает с URL эндпоинта', () => {
    expect(projectBotStatusesQueryKey(42)).toEqual(['/api/projects/42/bot/statuses']);
  });
});

describe('isBotStatusQueryKey', () => {
  it('ломает и список проекта, и одиночный токен', () => {
    expect(isBotStatusQueryKey('/api/projects/42/bot/statuses')).toBe(true);
    expect(isBotStatusQueryKey('/api/tokens/7/bot-status')).toBe(true);
    expect(isBotStatusQueryKey('/api/projects/42/tokens')).toBe(false);
  });
});
