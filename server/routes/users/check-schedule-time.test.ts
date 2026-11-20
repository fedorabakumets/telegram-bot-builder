/** @fileoverview Проверка интервалов и календарных месяцев без реальных вызовов Telegram. */
import { expect, it } from 'vitest';
import { nextCheckRun } from '../../../shared/check-schedule';
/** Интервалы отсчитываются от первого запуска и пропускают простой сервера. */
it.each([
  ['minute',60,'2026-11-17T09:00:00Z'],['hour',6,'2026-11-17T14:00:00Z'],
  ['day',1,'2026-11-18T08:00:00Z'],['week',1,'2026-11-24T08:00:00Z'],
] as const)('считает следующий интервал %s', (unit,every,expected) => {
  expect(nextCheckRun('2026-11-17T08:00:00Z',every,unit,new Date('2026-11-17T08:01:00Z')).toISOString()).toBe(new Date(expected).toISOString());
});
/** Месяц не подменяется тридцатью днями и не теряет исходное число после февраля. */
it('учитывает последний день февраля и возвращается к 31 марта', () => {
  const first = '2026-01-31T09:00:00Z';
  expect(nextCheckRun(first,1,'month',new Date(first)).toISOString()).toBe('2026-02-28T09:00:00.000Z');
  expect(nextCheckRun(first,1,'month',new Date('2026-02-28T09:00:00Z')).toISOString()).toBe('2026-03-31T09:00:00.000Z');
  const midnight = '2026-01-30T22:00:00Z';
  expect(nextCheckRun(midnight,1,'month',new Date(midnight)).toISOString()).toBe('2026-02-27T22:00:00.000Z');
});
/** Длительный простой не порождает очередь всех пропущенных проверок. */
it('сразу переносит пропущенные интервалы в будущее', () => {
  expect(nextCheckRun('2020-01-01T00:00:00Z',1,'minute',new Date('2026-11-17T08:00:00Z')).toISOString()).toBe('2026-11-17T08:01:00.000Z');
  expect(nextCheckRun('2026-12-01T00:00:00Z',1,'day',new Date('2026-11-17T08:00:00Z')).toISOString()).toBe('2026-12-01T00:00:00.000Z');
});
