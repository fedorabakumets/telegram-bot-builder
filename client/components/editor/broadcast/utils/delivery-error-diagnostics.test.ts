/**
 * @fileoverview Проверки диагностики ошибок и защиты секретов в рассылках.
 */
import { describe, expect, it } from 'vitest';
import { formatDeliveryErrorReason } from './format-delivery-error-reason';
import { deliveryErrorDetails } from './delivery-error-details';

describe('Диагностика доставки', () => {
  it('объясняет недоступное вложение до Telegram', () => {
    expect(formatDeliveryErrorReason('failed', "ENOENT: no such file '/app/uploads/photo.jpg'"))
      .toBe('Вложение недоступно');
    expect(formatDeliveryErrorReason('failed', '[broadcast_media] Недоступный объект'))
      .toBe('Вложение недоступно');
  });
  it('различает сеть и ошибки Telegram', () => {
    expect(formatDeliveryErrorReason('failed', 'fetch failed ECONNRESET')).toBe('Ошибка соединения');
    expect(formatDeliveryErrorReason('failed', 'Bad Request: message is too long')).toBe('Сообщение слишком длинное');
    expect(formatDeliveryErrorReason('blocked', 'Forbidden')).toBe('Заблокировал бота');
  });
  it('скрывает токены, авторизацию и секреты ссылок, сохраняя причину', () => {
    const secret = '123456789:abcdefghijklmnopqrstuvwxyz123456';
    const details = deliveryErrorDetails(`ENOENT https://user:pass@api.telegram.org/bot${secret}/sendPhoto?secret=abc Authorization: Bearer hidden password=hidden`);
    expect(details).toContain('ENOENT');
    expect(details).not.toContain(secret);
    expect(details).not.toContain('user:pass');
    expect(details).not.toContain('secret=abc');
    expect(details).not.toContain('hidden');
  });
});
