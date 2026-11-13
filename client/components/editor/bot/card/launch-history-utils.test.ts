/**
 * @fileoverview Проверки различия процесса запуска и ограничения Telegram в истории.
 */
import { describe, expect, it } from 'vitest';
import { getLaunchStatusMeta } from './launch-history-utils';

describe('состояние текущего запуска', () => {
  it('не называет ограниченного Telegram бота онлайн при работающем процессе', () => {
    const meta = getLaunchStatusMeta('running', null, true);
    expect(meta.label).toBe('Заморожен');
    expect(meta.footer).toContain('процесс можно остановить');
  });
  it('сохраняет исторические статусы без live-переопределения', () => {
    expect(getLaunchStatusMeta('running').label).toBe('Онлайн');
    expect(getLaunchStatusMeta('stopped').label).toBe('Остановлен');
    expect(getLaunchStatusMeta('error', 'Ошибка Telegram').footer).toBe('Ошибка Telegram');
  });
});
