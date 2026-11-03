/** @fileoverview Проверяет повторную проверку адресов перенаправления и закрепление DNS. */
import { EventEmitter } from 'node:events';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const fake = vi.hoisted(() => ({ lookup: vi.fn(), request: vi.fn() }));
vi.mock('node:dns/promises', () => ({ lookup: fake.lookup }));
vi.mock('node:http', () => ({ default: { request: fake.request } }));
import { safeExternalRequest } from '../../utils/safe-external-request';

beforeEach(() => { vi.clearAllMocks(); fake.lookup.mockResolvedValue([{ address: '8.8.8.8', family: 4 }]); });
describe('Перенаправления внешнего медиа', () => {
  it('проверяет цель redirect и не обращается к localhost', async () => {
    fake.request.mockImplementation((_url, _options, callback) => {
      const request = new EventEmitter() as EventEmitter & { end: () => void };
      request.end = () => callback({ statusCode: 302, headers: { location: 'http://127.0.0.1/private' }, resume: vi.fn() });
      return request;
    });
    await expect(safeExternalRequest('http://example.com/file', 'GET')).rejects.toThrow();
    expect(fake.request).toHaveBeenCalledTimes(1);
  });
  it('фиксирует проверенный DNS-адрес для соединения', async () => {
    fake.request.mockImplementation((_url, options, callback) => {
      options.lookup('example.com', {}, (_error: unknown, address: string) => expect(address).toBe('8.8.8.8'));
      const request = new EventEmitter() as EventEmitter & { end: () => void };
      request.end = () => callback({ statusCode: 200, headers: {} });
      return request;
    });
    await safeExternalRequest('http://example.com/file', 'GET');
    expect(fake.lookup).toHaveBeenCalledTimes(1);
  });
  it('отклоняет DNS с хотя бы одним внутренним адресом', async () => {
    fake.lookup.mockResolvedValue([{ address: '8.8.8.8', family: 4 }, { address: '10.0.0.2', family: 4 }]);
    await expect(safeExternalRequest('http://example.com/file', 'GET')).rejects.toThrow();
    expect(fake.request).not.toHaveBeenCalled();
  });
});
