/**
 * @fileoverview Проверки явного состояния процесса в бейдже ограничения Telegram.
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { BotRunStatusBadge } from './bot-run-status-badge';
import type { BotCanvasStatus } from './bot-canvas-status';
afterEach(cleanup);
describe('бейдж замороженного бота', () => {
  it.each([
    ['frozen_running', 'Заморожен · ожидается автоостановка'],
    ['frozen_stopped', 'Заморожен · процесс остановлен'],
    ['frozen_unknown', 'Заморожен · состояние процесса неизвестно'],
  ] satisfies Array<[BotCanvasStatus, string]>)('показывает %s явно', (status, label) => {
    render(<BotRunStatusBadge status={status} />);
    expect(screen.getByRole('status').textContent).toBe(label);
    if (status === 'frozen_running') expect(screen.getByRole('status').getAttribute('title')).toContain('Процесс ещё работает');
  });
});
