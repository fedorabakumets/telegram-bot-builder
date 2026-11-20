/** @fileoverview Проверка независимого наследования автоперезапуска и лимита попыток. */

import { expect, it } from 'vitest';
import { resolveBotAutoRestart } from './bot-execution-settings';

it('применяет общие значения только к полям с явным наследованием', () => {
  const project = { defaultAutoRestart: 1, defaultMaxRestartAttempts: 10 };
  const token = { autoRestart: 0, maxRestartAttempts: 1 };
  expect(resolveBotAutoRestart(project, { ...token, inheritAutoRestart: true })).toEqual({
    autoRestart: true, maxRestartAttempts: 1,
  });
  expect(resolveBotAutoRestart(project, { ...token, inheritMaxRestartAttempts: true })).toEqual({
    autoRestart: false, maxRestartAttempts: 10,
  });
});

it('после выхода из наследования уважает индивидуальное выключение и нижний предел попыток', () => {
  const project = { defaultAutoRestart: 1, defaultMaxRestartAttempts: 10 };
  expect(resolveBotAutoRestart(project, {
    autoRestart: 0, maxRestartAttempts: 1, inheritAutoRestart: false, inheritMaxRestartAttempts: false,
  })).toEqual({ autoRestart: false, maxRestartAttempts: 1 });
});

it('использует настройки старых записей и сохраняет запасной лимит для пустого значения', () => {
  const project = { defaultAutoRestart: 0, defaultMaxRestartAttempts: 10 };
  expect(resolveBotAutoRestart(project, { autoRestart: 1, maxRestartAttempts: 5 })).toEqual({
    autoRestart: true, maxRestartAttempts: 5,
  });
  expect(resolveBotAutoRestart(project, { autoRestart: null, maxRestartAttempts: null })).toEqual({
    autoRestart: false, maxRestartAttempts: 3,
  });
});
