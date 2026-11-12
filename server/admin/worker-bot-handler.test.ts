/** @fileoverview Проверки безопасных ответов и раннего отклонения неверных фильтров ботов. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import { createWorkerBotListHandler } from './worker-bot-handler';

/** Вызывает административный обработчик без сети и настоящих данных. */
async function invoke(query: unknown, collect: () => Promise<unknown>) {
  const result = { status: 200, headers: {} as Record<string, string>, body: undefined as unknown };
  const response = {
    setHeader: (name: string, value: string) => { result.headers[name] = value; },
    status: (code: number) => { result.status = code; return response; },
    json: (body: unknown) => { result.body = body; return response; },
  };
  await createWorkerBotListHandler(collect)({ query } as Request, response as unknown as Response, () => {});
  return result;
}

test('неверный фильтр не вызывает базу и запрещает кеширование', async () => {
  let calls = 0;
  const result = await invoke({ pageSize: 101 }, async () => { calls++; return {}; });
  assert.equal(calls, 0);
  assert.equal(result.status, 400);
  assert.equal(result.headers['Cache-Control'], 'no-store');
});

test('ошибка хранилища не раскрывает внутренний адрес, секрет и путь', async () => {
  const result = await invoke({}, async () => { throw new Error('redis://secret@host/private/path'); });
  assert.equal(result.status, 503);
  assert.deepEqual(result.body, { message: 'Не удалось получить режимы ботов. Повторите попытку' });
  assert.equal(result.headers['Cache-Control'], 'no-store');
});

test('успешная пустая страница возвращается без подмены отсутствующей телеметрии', async () => {
  const body = { rows: [], total: 0, runtimeAvailable: false, sampledAt: null };
  const result = await invoke({}, async () => body);
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, body);
});
