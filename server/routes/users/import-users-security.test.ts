/** @fileoverview Адресные проверки границ доверия импорта пользователей и выбора исходного бота. */
import { beforeEach, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { importUsersBodySchema } from './import-users-schema';
/** Изоляция проверок от настоящего хранилища и записи данных. */
const mocks = vi.hoisted(() => ({ getBotToken: vi.fn(), importUsers: vi.fn() }));
vi.mock('../../storages/storage', () => ({ storage: { getBotToken: mocks.getBotToken } }));
vi.mock('./import-users-repository', () => ({ importUsers: mocks.importUsers }));
import { importUsersHandler, selectImportSource } from './import-users-handler';
beforeEach(() => vi.clearAllMocks());
/** Возвращает минимальное допустимое тело запроса. @returns Независимый объект. */
function body() { return { tokenId: 9, users: [{ userId: '123' }] }; }

/** Служебные поля не проходят в репозиторий, даже если присутствуют в выгрузке. */
it('отбрасывает состояния Telegram, статистику и область из строк файла', () => {
  const result = importUsersBodySchema.parse({ ...body(), users: [{ userId: '123', projectId: 999,
    token: 'секрет', authorizationError: 'telegram_frozen', isActive: 1, isDeleted: 1,
    incomingMessageCount: 100, buttonClickCount: 100 }] });
  expect(result.users).toEqual([{ userId: '123' }]);
});

/** Запрещённые ключи не должны попадать в объединение переменных. */
it.each(['__proto__', 'constructor', 'prototype'])('отказывает для вложенного опасного ключа %s', key => {
  const userData = JSON.parse(`{"nested":{"${key}":{"polluted":true}}}`);
  expect(importUsersBodySchema.safeParse({ ...body(), users: [{ userId: '123', userData }] }).success).toBe(false);
  expect(({} as Record<string, unknown>).polluted).toBeUndefined();
});

/** Небезопасные ID и избыточные структуры отклоняются до обращения к базе. */
it('ограничивает идентификаторы, размер массива и глубину переменных', () => {
  expect(importUsersBodySchema.safeParse({ ...body(), users: [{ userId: '9007199254740992' }] }).success).toBe(false);
  expect(importUsersBodySchema.safeParse({ ...body(), users: Array(10_001).fill({ userId: '123' }) }).success).toBe(false);
  let nested: unknown = 'значение';
  for (let index = 0; index < 10; index++) nested = { nested };
  expect(importUsersBodySchema.safeParse({ ...body(), users: [{ userId: '123', userData: { nested } }] }).success).toBe(false);
  expect(importUsersBodySchema.safeParse({ ...body(), projectId: 999 }).success).toBe(false);
});

/** Сводные переменные не подмешиваются к выбранному контексту исходного бота. */
it('выбирает переменные одного бота и исключает чужие контексты', () => {
  const users = [{ userId: '123', userData: { aggregate: true }, deepLinkParam: 'общий', memberships: [
    { tokenId: 1, userData: { one: true }, deepLinkParam: 'первый' }, { tokenId: 2, userData: { two: true } },
  ] }, { userId: '456', tokenId: 1, userData: { other: true } }];
  expect(() => selectImportSource(users)).toThrow('Выберите исходного бота');
  expect(selectImportSource(users, 2)).toEqual([{ userId: '123', userData: { two: true },
    deepLinkParam: undefined, referrerId: undefined, memberships: undefined }]);
  expect(() => selectImportSource(users, 999)).toThrow('отсутствует');
});

/** Явный токен другого проекта не заменяется токеном по умолчанию. */
it.each([undefined, { id: 9, projectId: 13 }])('отказывает для отсутствующего или чужого целевого бота', async token => {
  mocks.getBotToken.mockResolvedValue(token);
  const response = { status: vi.fn(), json: vi.fn() };
  response.status.mockReturnValue(response);
  await importUsersHandler({ params: { projectId: '12' }, body: body() } as unknown as Request, response as unknown as Response);
  expect(response.status).toHaveBeenCalledWith(404);
  expect(mocks.importUsers).not.toHaveBeenCalled();
});
