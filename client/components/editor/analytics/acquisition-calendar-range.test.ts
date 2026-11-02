/** @fileoverview Календарные расходы привязаны к местным дням, включая переходы времени и точные пользовательские даты. */
import { expect, it } from 'vitest';
import { acquisitionCalendarRange } from './acquisition-calendar-range';
it('выбирает семь календарных дней Москвы, включая текущий, без изменения конца снимка', () => {
  const result = acquisitionCalendarRange({ from:'2026-10-26T04:00:00Z',to:'2026-11-02T04:00:00Z',timezone:'Europe/Moscow',period:'7d' });
  expect(result.from).toBe('2026-10-26T21:00:00.000Z');
  expect(result.to).toBe('2026-11-02T04:00:00Z');
});
it('на переходе зимнего времени использует местную полночь, а не вычитание 24 часов', () => {
  const result = acquisitionCalendarRange({ from:'2026-10-24T13:00:00Z',to:'2026-10-25T13:00:00Z',timezone:'Europe/Berlin',period:'24h' });
  expect(result.from).toBe('2026-10-24T22:00:00.000Z');
});
it('сохраняет явные даты и начинает всё время с местной полуночи первого дня', () => {
  const range = { from:'2026-10-20T21:00:00Z',to:'2026-10-22T21:00:00Z',timezone:'Europe/Moscow' };
  expect(acquisitionCalendarRange(range)).toEqual(range);
  expect(acquisitionCalendarRange({...range,from:'2026-10-20T10:00:00Z',period:'all'}).from).toBe('2026-10-19T21:00:00.000Z');
});
