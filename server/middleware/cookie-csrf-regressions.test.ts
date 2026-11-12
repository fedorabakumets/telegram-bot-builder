/** @fileoverview Регрессии CSRF: все изменяющие методы, источник и границы машинных исключений. */
import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { cookieCsrf } from './cookie-csrf';

/**
 * Проверяет решение защиты для действующей пользовательской сессии без HTTP и базы данных.
 * @param method - Метод запроса
 * @param headers - Заголовки источника и типа тела
 * @param path - Полный путь запроса
 * @returns Вызовы следующего обработчика и ответа с отказом
 */
function inspect(method: string, headers: Record<string, string> = {}, path = '/api/projects/12') {
  const values = new Map(Object.entries({ host: 'panel.example', ...headers }));
  const next = vi.fn();
  const status = vi.fn();
  const json = vi.fn();
  const res = { status, json };
  status.mockReturnValue(res);
  const req = {
    method, originalUrl: path, protocol: 'https', session: { telegramUser: { id: 42 } },
    get: (name: string) => values.get(name.toLowerCase()),
    is: (name: string) => values.get('content-type')?.split(';')[0] === name,
  } as unknown as Request;
  cookieCsrf(req, res as unknown as Response, next as NextFunction);
  return { next, status, json };
}

describe('границы защиты пользовательской сессии', () => {
  it.each(['POST', 'PUT', 'PATCH', 'DELETE'])('проверяет %s до выполнения обработчика', (method) => {
    const rejected = inspect(method, { origin: 'https://evil.example' });
    expect(rejected.next).not.toHaveBeenCalled();
    expect(rejected.status).toHaveBeenCalledWith(403);
    expect(rejected.json).toHaveBeenCalledWith({ error: 'CSRF_ORIGIN_MISMATCH' });
    expect(inspect(method, { origin: 'https://panel.example' }).next).toHaveBeenCalledOnce();
  });

  it.each(['sec-fetch-site', 'sec-fetch-dest', 'sec-fetch-user'])(
    'не разрешает JSON или специальный заголовок без источника при %s', (header) => {
      /** Допустимые заголовки CLI без необязательных полей объединённого типа. */
      const cliHeaders: Record<string, string>[] = [
        { 'content-type': 'application/json' }, { 'x-botcraft-csrf': '1' },
      ];
      for (const cli of cliHeaders) {
        expect(inspect('POST', { ...cli, [header]: 'same-origin' }).status).toHaveBeenCalledWith(403);
      }
    },
  );

  it.each([
    'https://panel.example.evil.example', 'https://panel.example@evil.example',
    'https://name@panel.example', 'https://panel.example#fragment', 'not-a-url',
  ])('не принимает неоднозначный Origin %s даже с доверенным Referer', (origin) => {
    expect(inspect('POST', { origin, referer: 'https://panel.example/page' }).status).toHaveBeenCalledWith(403);
  });

  it.each([
    '/api/webhook/12/9/extra', '/api/webhook/12/not-a-number', '/api/webhook/12/9evil',
    '/api/hooks/12evil/pay', '/api/auth/agent/disconnect/extra', '/api/runtime/media/invoice-link/extra',
    '/api/WEBHOOK/12/9', '/api/Hooks/12/pay', '/api/auth/agent/Telegram',
    '/api/unknown', '/admin/api/unknown', '/admin/api/runtime-settings/workers',
  ])('не распространяет машинное исключение на соседний путь %s', (path) => {
    expect(inspect('POST', { origin: 'https://evil.example' }, path).status).toHaveBeenCalledWith(403);
  });

  it('игнорирует параметры URL при проверке точного машинного маршрута', () => {
    expect(inspect('POST', { origin: 'https://external.example' },
      '/api/webhook/12/9?next=/api/projects/12').next).toHaveBeenCalledOnce();
  });
});
