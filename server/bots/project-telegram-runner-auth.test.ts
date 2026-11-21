/** @fileoverview Проверяет отзыв доступа старого поколения раннера и прежней привязки. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { authorizeProjectTelegramRunner, projectTelegramRunnerKey } from './project-telegram-runner-auth';

afterEach(() => vi.unstubAllEnvs());

describe('Подпись общего Telegram-клиента', () => {
  it('сверяет поколение, аккаунт и маршрут без ограничения срока жизни работающего бота', () => {
    vi.stubEnv('PROJECT_TELEGRAM_RUNNER_SECRET', 'synthetic-runner-secret-at-least-32-bytes');
    const header = `Bearer ${projectTelegramRunnerKey(9, 5, 7, 81)}`;
    expect(authorizeProjectTelegramRunner(header, 9, 5)).toBe(true);
    expect(authorizeProjectTelegramRunner(header, 9, 5, 7, 81)).toBe(true);
    expect(authorizeProjectTelegramRunner(header, 9, 5, 8, 81)).toBe(false);
    expect(authorizeProjectTelegramRunner(header, 9, 5, 7, 82)).toBe(false);
    expect(authorizeProjectTelegramRunner(header, 9, 6, 7, 81)).toBe(false);
    expect(authorizeProjectTelegramRunner(header.replace('7.81.', '8.81.'), 9, 5)).toBe(false);
  });

  it('отвергает старый формат, повреждённые значения и отсутствие секрета', () => {
    vi.stubEnv('PROJECT_TELEGRAM_RUNNER_SECRET', 'synthetic-runner-secret-at-least-32-bytes');
    expect(authorizeProjectTelegramRunner(`Bearer ${'x'.repeat(43)}`, 9, 5)).toBe(false);
    expect(authorizeProjectTelegramRunner(`Bearer 9999999999999999.81.${'x'.repeat(43)}`, 9, 5)).toBe(false);
    vi.stubEnv('PROJECT_TELEGRAM_RUNNER_SECRET', '');
    expect(projectTelegramRunnerKey(9, 5, 7, 81)).toBeNull();
  });
});
