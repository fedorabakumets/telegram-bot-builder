/**
 * @fileoverview Проверки различия процесса запуска и ограничения Telegram в истории.
 */
import { describe, expect, it } from 'vitest';
import { getLaunchStatusMeta, resolveLaunchLiveStatus } from './launch-history-utils';
import { selectCurrentAndPast } from './select-current-launch';
import type { BotLaunchHistory } from '@shared/schema';

describe('состояние текущего запуска', () => {
  it('свежая остановка или ошибка важнее устаревшего свойства running', () => {
    for (const status of ['stopped', 'error', 'unknown', 'running']) expect(resolveLaunchLiveStatus(status, true)).toBe(status);
    expect(resolveLaunchLiveStatus(undefined, true)).toBe('running');
    expect(resolveLaunchLiveStatus(undefined, false)).toBeUndefined();
  });
  it('не называет ограниченного Telegram бота онлайн при работающем процессе', () => {
    const meta = getLaunchStatusMeta('running', null, true);
    expect(meta.label).toBe('Процесс работает');
    expect(meta.footer).toContain('ожидается автоматическая остановка');
  });
  it('показывает ожидание остановки до подтверждения, не подменяя неизвестность завершением', () => {
    expect(resolveLaunchLiveStatus('running', true, true)).toBe('stopping');
    expect(resolveLaunchLiveStatus('stopped', true, true)).toBe('stopped');
    expect(resolveLaunchLiveStatus('unknown', true, true)).toBe('unknown');
    expect(getLaunchStatusMeta('stopping', null, true).footer).toContain('ещё не подтверждена');
  });
  it('ограничение Telegram не превращает остановку или потерю связи в работающий процесс', () => {
    expect(getLaunchStatusMeta('stopped', null, true).label).toBe('Остановлен');
    expect(getLaunchStatusMeta('stopped', null, true).footer).toContain('Процесс остановлен');
    expect(getLaunchStatusMeta('unknown', null, true).label).toBe('Нет связи');
    expect(getLaunchStatusMeta('unknown', null, true).footer).toContain('неизвестно');
    expect(getLaunchStatusMeta('error', 'Сбой процесса', true).footer).toBe('Сбой процесса');
  });
  it('сохраняет исторические статусы без live-переопределения', () => {
    expect(getLaunchStatusMeta('running').label).toBe('Онлайн');
    expect(getLaunchStatusMeta('stopped').label).toBe('Остановлен');
    expect(getLaunchStatusMeta('error', 'Ошибка Telegram').footer).toBe('Ошибка Telegram');
  });
  it('не создаёт время остановки при недоступном исполнителе', () => {
    const record = { id: 1, status: 'running', stoppedAt: null } as BotLaunchHistory;
    const { current } = selectCurrentAndPast([record], false, false, true);
    expect(current).toBe(record);
    expect(current?.stoppedAt).toBeNull();
  });
});
