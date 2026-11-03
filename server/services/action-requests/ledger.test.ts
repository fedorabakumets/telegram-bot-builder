/** @fileoverview Изолированные проверки SQL-протокола журнала без сети и рабочей базы. */
import { describe, it, expect } from 'vitest';
import { ActionRequestLedger, actionRequestHash, type RequestSql } from './ledger';
/** Эмулирует атомарную уникальность и сохранение SQL-квитанций. */
class IsolatedSql implements RequestSql {
  /** Изолированные строки текущей проверки. */
  rows = new Map<string, any>();
  /** Запросы для проверки отсутствия исходных секретов. */
  calls: unknown[][] = [];
  /** Исполняет ограниченный протокол журнала. @param text - SQL. @param values - Параметры. @returns Результат. */
  async query(text: string, values: unknown[]) {
    this.calls.push(values);
    const key = JSON.stringify(values.slice(0, 3));
    const row = this.rows.get(key);
    if (text.startsWith('INSERT')) {
      if (row) return { rows: [] };
      this.rows.set(key, { request_hash: values[3], state: 'pending', status: null, receipt: null });
      return { rows: [{ request_id: values[2] }] };
    }
    if (text.startsWith('SELECT')) return { rows: row ? [{ ...row }] : [] };
    if (!row || row.state !== 'pending') return { rows: [] };
    if (text.includes("state='completed'")) Object.assign(row, { state: 'completed', status: values[3], receipt: JSON.parse(values[4] as string) });
    else if (text.includes("state='unknown'")) row.state = 'unknown';
    else row.receipt = JSON.parse(values[3] as string);
    return { rows: [{ request_id: values[2] }] };
  }
}
/** Общая авторизованная заявка теста. */
const key = { scope: 'project:11', action: 'send', requestId: '23701e46-e727-40fd-af09-7923df80af01' };
describe('постоянные заявки', () => {
  it('канонизирует вложенные ключи, сохраняя значимость массивов и адресата', () => {
    expect(actionRequestHash({ z: { b: 1, a: 2 }, a: 0 })).toBe(actionRequestHash({ a: 0, z: { a: 2, b: 1 } }));
    expect(actionRequestHash([1, 2])).not.toBe(actionRequestHash([2, 1]));
    expect(actionRequestHash({ tokenId: 1 })).not.toBe(actionRequestHash({ tokenId: 2 }));
  });
  it('только один конкурентный запрос получает право исполнения', async () => {
    const sql = new IsolatedSql(); const ledger = new ActionRequestLedger(sql);
    const claims = await Promise.all(Array.from({ length: 10 }, () => ledger.claim(key, 'hash')));
    expect(claims.filter(item => item.acquired)).toHaveLength(1);
    expect(claims.filter(item => !item.acquired).every(item => item.record?.state === 'pending')).toBe(true);
  });
  it('повтор после нового экземпляра журнала читает сохранённую квитанцию', async () => {
    const sql = new IsolatedSql(); const ledger = new ActionRequestLedger(sql);
    await ledger.claim(key, 'hash'); await ledger.complete(key, 201, { messageId: 12 });
    const repeated = await new ActionRequestLedger(sql).claim(key, 'hash');
    expect(repeated).toMatchObject({ acquired: false, record: { state: 'completed', status: 201, receipt: { messageId: 12 } } });
  });
  it('не захватывает unknown повторно и сохраняет частичный результат', async () => {
    const ledger = new ActionRequestLedger(new IsolatedSql());
    await ledger.claim(key, 'hash'); await ledger.checkpoint(key, { projectId: 12 }); await ledger.unknown(key);
    expect(await ledger.claim(key, 'hash')).toMatchObject({ acquired: false, record: { state: 'unknown', receipt: { projectId: 12 } } });
  });
  it('разделяет проекты и действия; журнал хранит отпечаток вместо тела', async () => {
    const sql = new IsolatedSql(); const ledger = new ActionRequestLedger(sql);
    const hash = actionRequestHash({ token: 'secret-target', message: 'private' });
    await ledger.claim(key, hash);
    expect((await ledger.claim({ ...key, scope: 'project:12' }, hash)).acquired).toBe(true);
    expect((await ledger.claim({ ...key, action: 'broadcast' }, hash)).acquired).toBe(true);
    expect(JSON.stringify(sql.calls)).not.toContain('secret-target');
    expect((await ledger.claim(key, 'changed')).record?.request_hash).toBe(hash);
  });
});
