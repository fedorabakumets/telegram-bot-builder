/**
 * @fileoverview Проверки сетевой защиты загрузчика внешних файлов.
 */
import { describe, expect, it } from 'vitest';
import { isPublicAddress, safeExternalRequest } from './safe-external-request';

describe('защита внешних URL', () => {
  it('отклоняет внутренние IPv4, IPv6 и отображённые IPv4', () => {
    for (const address of ['127.0.0.1', '10.0.0.1', '169.254.169.254', '::1', 'fc00::1', '::ffff:127.0.0.1']) {
      expect(isPublicAddress(address)).toBe(false);
    }
    expect(isPublicAddress('8.8.8.8')).toBe(true);
  });
  it('отклоняет внутренний адрес и учётные данные до соединения', async () => {
    await expect(safeExternalRequest('http://127.0.0.1/a', 'GET')).rejects.toThrow();
    await expect(safeExternalRequest('https://user:pass@example.com/a', 'GET')).rejects.toThrow();
  });
});
