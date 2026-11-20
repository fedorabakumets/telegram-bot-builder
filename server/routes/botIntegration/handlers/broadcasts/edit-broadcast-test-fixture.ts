/** @fileoverview Изолированная подмена запросов массовой правки без сети и базы данных. */
import { getTableName, type SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { vi } from 'vitest';

/** Записанный запрос позволяет проверить границы проекта, бота и сообщения. */
export interface EditQuery {
  /** Имя таблицы. */
  table: string;
  /** Изменяемые поля. */
  values?: Record<string, unknown>;
  /** SQL условия. */
  sql: string;
  /** Значения параметров условия. */
  params: unknown[];
}

const dialect = new PgDialect();
export const fixture = {
  rows: {} as Record<string, Record<string, unknown>[]>,
  reads: [] as EditQuery[],
  writes: [] as EditQuery[],
  returnedHistory: [{ id: 701, userId: '42', telegramMessageId: 98765 }],
  rejectedUpdateTable: '',
  edit: vi.fn(), event: vi.fn(), pause: vi.fn(),
};

/** Создаёт ожидаемую цепочку Drizzle, сохраняя фактическое условие запроса. */
function query(table: Parameters<typeof getTableName>[0], values?: Record<string, unknown>) {
  const name = getTableName(table);
  let rows: Record<string, unknown>[] = [];
  const chain = {
    /** Запоминает область запроса, не выполняя SQL. */
    where(condition: SQL) {
      const compiled = dialect.sqlToQuery(condition);
      (values ? fixture.writes : fixture.reads).push({ table: name, values, ...compiled });
      rows = values ? fixture.returnedHistory : fixture.rows[name] ?? [];
      return chain;
    },
    /** Поддерживает чтение одной записи. */
    limit(count: number) { rows = rows.slice(0, count); return chain; },
    /** Возвращает заранее известные идентификаторы истории. */
    returning() { return Promise.resolve(rows); },
    /** Разрешает ожидать цепочку, как настоящий запрос Drizzle. */
    then(resolve: (result: Record<string, unknown>[]) => unknown, reject?: (reason: unknown) => unknown) {
      if (values && fixture.rejectedUpdateTable === name) return Promise.reject(new Error('Сбой записи')).then(resolve, reject);
      return Promise.resolve(rows).then(resolve, reject);
    },
  };
  return chain;
}

export const testDb = {
  /** Подменяет только чтение строк. */
  select: () => ({ from: (table: Parameters<typeof getTableName>[0]) => query(table) }),
  /** Подменяет запись и сохраняет условия для проверки границ. */
  update: (table: Parameters<typeof getTableName>[0]) => ({ set: (values: Record<string, unknown>) => query(table, values) }),
};

/** Возвращает базовую рассылку с кнопкой поддержки и отдельными внутренними ID. */
export function resetEditFixture() {
  vi.clearAllMocks();
  fixture.reads.length = 0; fixture.writes.length = 0;
  fixture.rows = {
    broadcasts: [{ id: 40, projectId: 13, tokenId: 11, status: 'done', messageText: 'Прежний текст',
      buttons: [{ id: 'support', text: 'Открыть поддержку', action: 'url', url: 'https://torlink.life/support' }], buttonsPerRow: 2 }],
    bot_tokens: [{ id: 11, projectId: 13, token: 'test-token' }],
    broadcast_results: [{ id: 901, broadcastId: 40, userId: '42', status: 'sent', telegramMessageId: 98765 }],
    bot_messages: [{ id: 701, projectId: 13, tokenId: 11, userId: '42', telegramMessageId: 98765,
      messageText: 'Прежний текст', messageData: { broadcastId: 40 } }],
  };
  fixture.returnedHistory = [{ id: 701, userId: '42', telegramMessageId: 98765 }];
  fixture.rejectedUpdateTable = '';
  fixture.edit.mockResolvedValue({ status: 'edited' });
}
