/**
 * @fileoverview Статус карточки бота на холсте.
 * @module bot/canvas/bot-canvas-status.test
 */

import { describe, expect, it } from 'vitest';
import { botCanvasStatusLabel, resolveBotCanvasStatus } from './bot-canvas-status';

describe('resolveBotCanvasStatus', () => {
  it('показывает остановку ограниченного или отключённого бота', () => {
    expect(resolveBotCanvasStatus({ frozen: true, isRunning: true, operation: 'stopping' })).toBe('stopping');
    expect(resolveBotCanvasStatus({ authorizationError: 'unauthorized', isActive: 0, isRunning: true,
      operation: 'stopping' })).toBe('stopping');
  });

  /** Недоступность исполнителя не доказывает остановку процесса. */
  it('показывает отсутствие связи вместо офлайна при неизвестном состоянии', () => {
    expect(resolveBotCanvasStatus({ isActive: 1, isRunning: false, unknown: true })).toBe('unknown');
    expect(botCanvasStatusLabel('unknown')).toBe('Нет связи');
  });
  it('показывает заморозку даже при работающем процессе', () => {
    expect(resolveBotCanvasStatus({ frozen: true, isRunning: true })).toBe('frozen_running');
    expect(botCanvasStatusLabel('frozen_running')).toBe('Заморожен · ожидается автоостановка');
  });
  it('не скрывает остановленный или неизвестный процесс за заморозкой', () => {
    expect(resolveBotCanvasStatus({ frozen: true, isRunning: false })).toBe('frozen_stopped');
    expect(botCanvasStatusLabel('frozen_stopped')).toBe('Заморожен · процесс остановлен');
    expect(resolveBotCanvasStatus({ frozen: true, isRunning: true, unknown: true })).toBe('frozen_unknown');
    expect(botCanvasStatusLabel('frozen_unknown')).toContain('состояние процесса неизвестно');
  });
  it('считает подтверждённый недействительный токен важнее старой заморозки', () => {
    expect(resolveBotCanvasStatus({ frozen: true, authorizationError: 'unauthorized', isRunning: false })).toBe('invalid');
  });
  it('помечает недействительный токен даже если процесс не запущен', () => {
    expect(resolveBotCanvasStatus({ isActive: 0, authorizationError: 'unauthorized', isRunning: false, hasFailure: true }))
      .toBe('invalid');
  });

  it('ручное отключение не называет ошибкой токена', () => {
    expect(resolveBotCanvasStatus({ isActive: 0, isRunning: false })).toBe('inactive');
    expect(botCanvasStatusLabel('inactive')).toBe('Отключён');
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
  it('пишет «Недействительный токен»', () => {
    expect(botCanvasStatusLabel('invalid')).toBe('Недействительный токен');
  });
});
