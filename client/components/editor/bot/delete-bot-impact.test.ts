/**
 * @fileoverview Список последствий удаления бота.
 * @module bot/delete-bot-impact.test
 */

import { describe, expect, it } from 'vitest';
import { listDeleteBotImpact } from './delete-bot-impact';

describe('listDeleteBotImpact', () => {
  it('добавляет процесс, если бот онлайн', () => {
    const labels = listDeleteBotImpact({ isRunning: true }).map((item) => item.label);
    expect(labels).toContain('Запущенный процесс');
  });

  it('пишет число пользователей', () => {
    const labels = listDeleteBotImpact({ isRunning: false, userCount: 12 }).map((item) => item.label);
    expect(labels.some((label) => label.includes('12'))).toBe(true);
  });

  it('не добавляет пользователей при нуле', () => {
    const labels = listDeleteBotImpact({ isRunning: false, userCount: 0 }).map((item) => item.label);
    expect(labels.some((label) => label.includes('Пользователи'))).toBe(false);
  });

  it('включает диалоги и аналитику', () => {
    const labels = listDeleteBotImpact({ isRunning: false }).map((item) => item.label);
    expect(labels).toContain('Диалоги и переписка этого бота');
    expect(labels).toContain('Аналитика этого бота');
  });
});
