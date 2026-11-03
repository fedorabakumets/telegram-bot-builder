/** @fileoverview Проверки отказа внутренних адресов при загрузке внешнего медиа. */
import { describe, expect, it } from 'vitest';
import { isPublicAddress, safeExternalRequest } from '../../utils/safe-external-request';

describe('Защита внешней загрузки', () => {
  it.each(['127.0.0.1', '10.0.0.1', '172.16.0.1', '192.168.1.1', '169.254.169.254', '::1', 'fc00::1', 'fe80::1', '::ffff:127.0.0.1'])('запрещает внутренний адрес %s', address => {
    expect(isPublicAddress(address)).toBe(false);
  });
  it.each(['8.8.8.8', '2606:4700:4700::1111'])('разрешает публичный адрес %s', address => {
    expect(isPublicAddress(address)).toBe(true);
  });
  it('отклоняет локальный адрес до установки соединения', async () => {
    await expect(safeExternalRequest('http://127.0.0.1:1234/x', 'GET')).rejects.toThrow();
  });
  it('отклоняет URL с учётными данными', async () => {
    await expect(safeExternalRequest('https://user:secret@example.com/x', 'GET')).rejects.toThrow();
  });
});
