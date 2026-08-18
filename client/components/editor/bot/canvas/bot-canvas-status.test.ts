/**
 * @fileoverview Статус карточки бота на холсте.
 * @module bot/canvas/bot-canvas-status.test
 */

import { describe, expect, it } from 'vitest';
import { botCanvasStatusLabel, resolveBotCanvasStatus } from './bot-canvas-status';

describe('resolveBotCanvasStatus', () => {
  it('помечает недействительный токен даже если процесс не запущен', () => {
    expect(resolveBotCanvasStatus({ isActive: 0, isRunning: false, hasFailure: true }))
      .toBe('invalid');
  });

  it('онлайн только у живого токена с запущенным процессом', () => {
    expect(resolveBotCanvasStatus({ isActive: 1, isRunning: true })).toBe('online');
  });

  it('ошибка запуска — только если токен живой', () => {
    expect(resolveBotCanvasStatus({ isActive: 1, isRunning: false, hasFailure: true }))
      .toBe('failed');
  });
});

describe('botCanvasStatusLabel', () => {
  it('пишет «Токен недействителен»', () => {
    expect(botCanvasStatusLabel('invalid')).toBe('Токен недействителен');
  });
});
