/** @fileoverview Проверка переноса типов переменных, связей с ботами и безопасности выгрузки. */
import { expect, it } from 'vitest';
import { createUserTransfer, parseUserTransfer, serializeUserTransfer } from './user-transfer';
/** Возвращает пользователя с разными переменными в двух ботах. */
const fixture = () => [{ userId: '1234567890123456', firstName: '=1+1', userData: { total: 3 }, token: 'SECRET',
  botMemberships: [{ tokenId: 1, name: 'Первый', userData: { answer: false }, acquisitionSource: 'A', incomingMessageCount: 2 },
    { tokenId: 2, name: 'Второй', userData: { answer: [1, null, 'да'] }, acquisitionSource: 'B', incomingMessageCount: 4 }] }];
it('сохраняет типы и отдельные данные ботов, исключая секреты и невыбранные поля', () => {
  const doc = createUserTransfer(fixture(), ['variables', 'sources']);
  const restored = parseUserTransfer('\uFEFF' + serializeUserTransfer(doc, 'json'));
  expect(restored.users[0].memberships?.[1].userData?.answer).toEqual([1, null, 'да']);
  expect(restored.users[0].memberships?.[0].acquisitionSource).toBe('A');
  expect(restored.users[0]).not.toHaveProperty('firstName');
  expect(JSON.stringify(doc)).not.toContain('SECRET');
});
it('даёт отдельные строки CSV и нейтрализует формулы', () => {
  const csv = serializeUserTransfer(createUserTransfer(fixture(), ['profile', 'variables']), 'csv');
  expect(csv.startsWith('\uFEFF')).toBe(true);
  expect(csv.split('\r\n')).toHaveLength(3);
  expect(csv).toContain("'=1+1");
  expect(csv).toContain('1234567890123456');
});
it('отклоняет опасные ключи, неправильные ID и неизвестную версию', () => {
  const doc = createUserTransfer(fixture(), ['variables']);
  expect(() => parseUserTransfer(JSON.stringify({ ...doc, version: 2 }))).toThrow();
  expect(() => parseUserTransfer(JSON.stringify({ ...doc, users: [{ userId: '-1' }] }))).toThrow();
  expect(() => parseUserTransfer(JSON.stringify({ ...doc, users: [{ userId: '1', userData: JSON.parse('{"__proto__":{}}') }] }))).toThrow();
});
/** Независимый выбор исключает соседние поля в JSON и в заголовках CSV. */
it('выгружает только выбранные отдельные поля', () => {
  const doc = createUserTransfer([{ userId: '123', firstName: 'Анна', lastName: 'Иванова', userName: 'anna',
    isPremium: true, incomingMessageCount: 7, buttonClickCount: 4, registeredAt: '2026-11-17', lastInteraction: '2026-11-18' }],
  ['userName', 'buttonClickCount', 'lastInteraction']);
  expect(parseUserTransfer(serializeUserTransfer(doc, 'json')).users[0]).toEqual({ userId: '123', userName: 'anna', buttonClickCount: 4, lastInteraction: '2026-11-18' });
  const columns = serializeUserTransfer(doc, 'csv').split('\r\n')[0];
  expect(columns).toContain('buttonClickCount');
  expect(columns).not.toMatch(/firstName|lastName|isPremium|incomingMessageCount|registeredAt/);
});
