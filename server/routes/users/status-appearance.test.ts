/** @fileoverview Проверка общего оформления коротких и полных статусов без смешивания разных ограничений. */
import { expect, it } from 'vitest';
import { statusAppearance } from '../../../shared/status-appearance';
import { botAvailabilityLabel, botShortStatusLabel } from '../../../shared/bot-availability-label';
/** Полная и короткая подписи заморозки одинаково красные, остальные ошибки остаются предупреждениями. */
it('согласует оформление селектора, таблицы и сводки', () => {
  const full = botAvailabilityLabel('telegram_frozen', 0);
  const short = botShortStatusLabel('telegram_frozen', 0);
  expect(statusAppearance(full).color).toBe('#ef4444');
  expect(statusAppearance(short)).toEqual(statusAppearance(full));
  expect(statusAppearance(botAvailabilityLabel('unauthorized', 0)).color).toBe('#d4a951');
  expect(statusAppearance('Пользователь заблокировал бота').color).toBe('#d4a951');
  expect(statusAppearance(botShortStatusLabel(null, 1)).color).toBe('#10b981');
  expect(statusAppearance('Не проверен').color).toBe('var(--muted-foreground)');
});
