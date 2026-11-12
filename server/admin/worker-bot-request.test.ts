/** @fileoverview Проверки ограничений и неоднозначных параметров списка режимов ботов. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseWorkerBotQuery } from './worker-bot-request';

test('пустой запрос имеет ограниченную первую страницу и все режимы', () => {
  const result = parseWorkerBotQuery({});
  assert.equal(result.success, true);
  if (result.success) assert.deepEqual(result.data, { activity: 'enabled', search: '', mode: 'all', page: 1, pageSize: 25 });
});

test('поиск обрезает пробелы, а числовые строки допускаются в границах', () => {
  const result = parseWorkerBotQuery({ search: '  Напоминалка  ', page: '100000', pageSize: '100', mode: 'process' });
  assert.equal(result.success, true);
  if (result.success) assert.deepEqual(result.data, { activity: 'enabled', search: 'Напоминалка', page: 100000, pageSize: 100, mode: 'process' });
});

test('неизвестные режимы, массивы, дробные и чрезмерные страницы отклоняются', () => {
  for (const value of [
    { mode: 'shared' }, { mode: ['direct', 'process'] }, { search: ['a', 'b'] },
    { page: 0 }, { page: -1 }, { page: '1.5' }, { page: 'Infinity' }, { page: '100001' },
    { page: ['1'] }, { pageSize: ['25'] }, { page: true },
    { pageSize: 0 }, { pageSize: 101 }, { pageSize: 'NaN' }, { search: 'я'.repeat(101) },
  ]) assert.equal(parseWorkerBotQuery(value).success, false, JSON.stringify(value));
});

test('лишние параметры не становятся частью запроса к хранилищу', () => {
  const result = parseWorkerBotQuery({ token: 'не передавать', ownerId: 'другой', search: '/start' });
  assert.equal(result.success, true);
  if (result.success) assert.deepEqual(Object.keys(result.data).sort(), ['activity', 'mode', 'page', 'pageSize', 'search']);
});

/** Проверяет явное раскрытие остановленных ботов и запрет неизвестного фильтра. */
test('остановленных можно включить только допустимым фильтром', () => {
  assert.equal(parseWorkerBotQuery({ activity: 'all' }).success, true);
  assert.equal(parseWorkerBotQuery({ activity: 'sleeping' }).success, false);
});
