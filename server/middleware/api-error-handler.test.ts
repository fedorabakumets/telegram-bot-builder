/** @fileoverview Проверки отсутствия SQL и секретов в ответе и журнале ошибки API. */
import { afterEach, expect, it, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { apiErrorHandler } from './api-error-handler';

afterEach(() => vi.restoreAllMocks());

/**
 * Создаёт ответ HTTP для проверки обработки отказов.
 * @returns Заглушка ответа Express
 */
function response() {
  return { headersSent: false, status: vi.fn().mockReturnThis(), set: vi.fn().mockReturnThis(), json: vi.fn() };
}

it('не раскрывает SQL и не выбрасывает ошибку повторно', () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  const res = response(); const next = vi.fn();
  const error = new Error('SELECT password FROM users; postgres://private:secret@db');
  expect(() => apiErrorHandler(error, {} as Request, res as unknown as Response, next)).not.toThrow();
  expect(res.status).toHaveBeenCalledWith(500);
  expect(res.json).toHaveBeenCalledWith({ message: 'Внутренняя ошибка сервера' });
  expect(JSON.stringify(log.mock.calls)).not.toContain('secret');
  expect(next).not.toHaveBeenCalled();
});

it('сохраняет ошибки валидации клиента', () => {
  const res = response();
  apiErrorHandler({ status: 400, message: 'Неверный ID' }, {} as Request, res as unknown as Response, vi.fn());
  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({ message: 'Неверный ID' });
});

it('передаёт уже начатый ответ стандартному обработчику', () => {
  const res = { ...response(), headersSent: true }; const next = vi.fn(); const error = new Error('stream');
  apiErrorHandler(error, {} as Request, res as unknown as Response, next as NextFunction);
  expect(next).toHaveBeenCalledWith(error);
  expect(res.json).not.toHaveBeenCalled();
});
