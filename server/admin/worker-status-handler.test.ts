/** @fileoverview Проверки отсутствия кеширования и утечки внутренних ошибок состояния воркеров. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import { createWorkerStatusHandler } from './worker-status-handler';

/** Вызывает маршрут без сетевого сервера и возвращает записанный ответ. */
async function invoke(collect: () => Promise<unknown>) {
  const result = { status: 200, headers: {} as Record<string, string>, body: undefined as unknown };
  const response = {
    setHeader: (name: string, value: string) => { result.headers[name] = value; },
    status: (code: number) => { result.status = code; return response; },
    json: (body: unknown) => { result.body = body; return response; },
  };
  await createWorkerStatusHandler(collect)({} as Request, response as unknown as Response, () => {});
  return result;
}

test('снимок сохраняет нулевые и неизвестные показатели и запрещает кеширование', async () => {
  const snapshot = { memoryMb: 0, metrics: { nodeRssBytes: null, pythonRssBytes: 0 } };
  const result = await invoke(async () => snapshot);
  assert.deepEqual(result.body, snapshot);
  assert.equal(result.headers['Cache-Control'], 'no-store');
  assert.equal(result.status, 200);
});

test('внутренняя ошибка не отдаёт секреты, адреса и пути', async () => {
  const result = await invoke(async () => { throw new Error('redis://secret@internal/private/file'); });
  assert.equal(result.status, 500);
  assert.deepEqual(result.body, { message: 'Не удалось получить состояние воркеров' });
  assert.equal(result.headers['Cache-Control'], 'no-store');
});
