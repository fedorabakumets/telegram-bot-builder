/** @fileoverview Проверки маскирования старой переписки без потери дат, идентификаторов и обычных меток. */
import { describe, expect, it } from 'vitest';
import { safeAuthPayloads } from '../../utils/safe-auth-payloads';
describe('Безопасная стандартная история', () => {
  it('скрывает код во вложенных данных и сохраняет исходное сообщение для обработчика', () => {
    const date = new Date('2026-10-31T12:00:00Z');
    const original = { text: '/start link_secret', data: { keyboard: [{ url: 'https://t.me/bot?start=link_secret' }], link_secret: 'value' }, date, tag: 'channel_post_1' };
    const result = safeAuthPayloads(original);
    expect(JSON.stringify(result)).not.toContain('secret');
    expect(result.text).toBe('/start link_[скрыто]');
    expect(result.date).toBe(date); expect(result.tag).toBe('channel_post_1');
    expect(original.text).toBe('/start link_secret');
  });
});
