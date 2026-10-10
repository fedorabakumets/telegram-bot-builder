/**
 * @fileoverview Проверки валидации диапазона и лимита запросов логов.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseBotLogPeriodQuery } from './bot-log-period-query';

test('запрос без периода сохраняет текущий запуск', () => {
  assert.deepEqual(parseBotLogPeriodQuery({}), { limit: 500 });
});
test('принимает абсолютные границы и устойчивый курсор', () => {
  const result = parseBotLogPeriodQuery({ from: '2026-10-10T00:00:00+03:00', to: '2026-10-11T00:00:00+03:00', limit: '100', beforeId: '400' });
  assert.equal(result.from?.toISOString(), '2026-10-09T21:00:00.000Z');
  assert.equal(result.to?.toISOString(), '2026-10-10T21:00:00.000Z');
  assert.equal(result.beforeId, 400);
  assert.equal(result.limit, 100);
});
test('отклоняет ошибочные границы, массивы, лимиты и курсоры', () => {
  const range = { from: '2026-10-10T00:00:00Z', to: '2026-10-11T00:00:00Z' };
  for (const invalid of [
    { from: range.from }, { to: range.to }, { from: range.to, to: range.from },
    { ...range, to: range.from }, { ...range, from: '2026-10-10T00:00:00' },
    { ...range, from: ['2026-10-10T00:00:00Z'] }, { ...range, from: 'bad' },
    { limit: '1001' }, { limit: '0' }, { limit: '-1' }, { limit: '50bad' },
    { beforeId: '10' }, { ...range, beforeId: '0' }, { ...range, beforeId: '2.5' },
  ]) assert.throws(() => parseBotLogPeriodQuery(invalid));
});
