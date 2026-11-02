/** @fileoverview Проверка маскирования старых логов без изменения дат, порядка и служебных полей. */
import { describe, expect, it } from 'vitest';
import { safeBotLog } from '../../utils/safe-bot-log';
describe('Безопасные строки журнала', () => {
  it('скрывает коды входа, MCP и токен бота в ранее сохранённом тексте', () => {
    const timestamp = new Date('2026-10-31T12:00:00Z');
    const original = { id: 17, projectId: 1, tokenId: 11, timestamp, content: '/start link_secret; mcp_private; 123456789:abcdefghijklmnopqrstuvwxyz123456789; source=channel_post_1' };
    const result = safeBotLog(original);
    expect(result.content).not.toMatch(/link_secret|mcp_private|abcdefghijklmnopqrstuvwxyz/);
    expect(result.content).toContain('source=channel_post_1');
    expect(result.content).toContain('link_[скрыто]');
    expect(result.timestamp).toBe(timestamp); expect(result.id).toBe(17);
    expect(original.content).toContain('link_secret');
  });
});
