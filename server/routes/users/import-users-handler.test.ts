/** @fileoverview Проверки границ импорта: явный бот, источник переменных и запрет служебных данных. */
import { beforeEach, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
const mocks = vi.hoisted(() => ({ getBotToken: vi.fn(), importUsers: vi.fn() }));
vi.mock('../../storages/storage', () => ({ storage: { getBotToken: mocks.getBotToken } }));
vi.mock('./import-users-repository', () => ({ importUsers: mocks.importUsers }));
import { importUsersHandler, selectImportSource } from './import-users-handler';
import { importUsersBodySchema } from './import-users-schema';
/** Создаёт ответ без HTTP-сервера. @returns Наблюдаемые методы ответа. */
function response() { const res = { status: vi.fn(), json: vi.fn() }; res.status.mockReturnValue(res); return res; }
beforeEach(() => { vi.clearAllMocks(); mocks.getBotToken.mockResolvedValue({ id: 9, projectId: 12 }); });
/** Чужой бот не приводит к fallback на бот текущего проекта. */
it('отклоняет чужого бота и отсутствие явного назначения', async () => {
  mocks.getBotToken.mockResolvedValue({ id: 9, projectId: 13 });
  const res = response();
  await importUsersHandler({ params: { projectId: '12' }, body: { tokenId: 9, users: [{ userId: '1' }] } } as unknown as Request, res as unknown as Response);
  expect(res.status).toHaveBeenCalledWith(404);
  expect(mocks.importUsers).not.toHaveBeenCalled();
  expect(importUsersBodySchema.safeParse({ users: [{ userId: '1' }] }).success).toBe(false);
});
/** Статусы, счётчики и локальная область файла не попадают в запись. */
it('удаляет неразрешённые поля строки и оставляет предпросмотр по умолчанию', () => {
  const result = importUsersBodySchema.parse({ tokenId: 9, users: [{ userId: '1', projectId: 99,
    isActive: 1, isBlocked: true, interactionCount: 999, userData: { zero: 0, flag: false } }] });
  expect(result.apply).toBe(false);
  expect(result.users[0]).toEqual({ userId: '1', userData: { zero: 0, flag: false } });
});
/** Разные боты имеют независимые переменные и параметры запуска. */
it('требует исходного бота и выбирает только его переменные', () => {
  const users = [{ userId: '1', userData: { aggregate: true }, deepLinkParam: 'wrong', memberships: [
    { tokenId: 2, userData: { city: 'Москва' } }, { tokenId: 3, userData: { city: 'Тула' }, deepLinkParam: 'correct' },
  ] }];
  expect(() => selectImportSource(users)).toThrow('Выберите исходного бота');
  expect(selectImportSource(users, 3)[0]).toMatchObject({ userData: { city: 'Тула' }, deepLinkParam: 'correct' });
  expect(selectImportSource(users, 2)[0].deepLinkParam).toBeUndefined();
  expect(() => selectImportSource(users, 999)).toThrow('Исходный бот отсутствует');
});
/** Опасные вложенные ключи отбрасываются до репозитория. */
it('не принимает ключи прототипа и нецелые или нулевые Telegram ID', () => {
  const users = JSON.parse('[{"userId":"1","userData":{"nested":{"__proto__":{"x":1}}}}]');
  expect(importUsersBodySchema.safeParse({ tokenId: 9, users }).success).toBe(false);
  for (const userId of ['0', '-1', '1.5', '9007199254740992']) {
    expect(importUsersBodySchema.safeParse({ tokenId: 9, users: [{ userId }] }).success).toBe(false);
  }
});
