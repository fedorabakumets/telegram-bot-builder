/** @fileoverview Проверки правдивых уведомлений о редактировании рассылки. */
import { describe, expect, it } from 'vitest';
import { getBroadcastEditNotice, isBroadcastEditComplete } from './edit-result';

describe('Результат редактирования', () => {
  it('подтверждает только полный успех', () => {
    expect(getBroadcastEditNotice({ edited: 9, failed: 0 }).variant).toBe('default');
  });
  it('считает совпадающее содержимое подтверждённым и учитывает неизвестные результаты', () => {
    expect(isBroadcastEditComplete({ edited: 0, unchanged: 9, failed: 0 })).toBe(true);
    expect(isBroadcastEditComplete({ edited: 8, unknown: 1, failed: 0 })).toBe(false);
    expect(isBroadcastEditComplete({ edited: 9, persistence: false, failed: 0 })).toBe(false);
    expect(isBroadcastEditComplete({ edited: 9, skipped: 1, failed: 0 })).toBe(false);
  });
  it('учитывает вложенное подтверждение сохранения', () => {
    expect(isBroadcastEditComplete({ edited: 9, failed: 0, persistence: { confirmed: false, failed: 1 } })).toBe(false);
    expect(isBroadcastEditComplete({ edited: 9, failed: 0, persistence: { confirmed: true, failed: 0 } })).toBe(true);
    expect(getBroadcastEditNotice({ edited: 9, failed: 0, persistence: { confirmed: false, failed: 1 } }).description).toContain('Сохранение на сайте не подтверждено');
  });
  it('не маскирует частичный результат', () => {
    const result = getBroadcastEditNotice({ edited: 8, failed: 1 });
    expect(result.title).toContain('частично');
    expect(result.variant).toBe('destructive');
    expect(result.description).toContain('1');
  });
  it('не показывает успех при нуле изменений или отказе сервера', () => {
    expect(getBroadcastEditNotice({ edited: 0, failed: 0 }).variant).toBe('destructive');
    expect(getBroadcastEditNotice({ edited: 9, failed: 0, ok: false }).variant).toBe('destructive');
  });
});
