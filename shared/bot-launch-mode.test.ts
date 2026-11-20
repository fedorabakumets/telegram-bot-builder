/** @fileoverview Проверка выбора транспорта проекта и совместимости со старыми ботами. */

import { expect, it } from 'vitest';
import { resolveBotLaunchMode } from './bot-launch-mode';

it('применяет изменённый режим проекта только к наследующим ботам', () => {
  expect(resolveBotLaunchMode('webhook', 'polling', true)).toBe('webhook');
  expect(resolveBotLaunchMode('polling', 'webhook', true)).toBe('polling');
  expect(resolveBotLaunchMode('webhook', 'polling', false)).toBe('polling');
});

it('сохраняет собственный режим старого бота и выбирает polling при пустой настройке', () => {
  expect(resolveBotLaunchMode('polling', 'webhook', undefined)).toBe('webhook');
  expect(resolveBotLaunchMode('polling', 'webhook', null)).toBe('webhook');
  expect(resolveBotLaunchMode(null, 'webhook', true)).toBe('polling');
});
