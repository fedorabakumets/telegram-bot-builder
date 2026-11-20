/** @fileoverview Проверки автоматического применения времени сообщений и исправления неверного диапазона. */
import { useState } from 'react';
import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { DialogMessagePeriod, messageTimeBoundary } from './dialog-message-period';

const changed = vi.hoisted(() => vi.fn());
vi.mock('../content/user-directory-controls', () => ({
  /** Предоставляет управляемый набор фильтров без запросов к серверу. */
  useDirectoryControls: () => {
    const [advanced, set] = useState({});
    return { advanced, setAdvanced: (value: object) => { changed(value); set(value); } };
  },
}));
afterEach(() => { cleanup(); changed.mockClear(); });

it('применяет московское время и включает всю последнюю минуту', () => {
  expect(messageTimeBoundary('2026-11-05T04:04', true)).toBe('2026-11-05T04:04:59.999+03:00');
  render(<DialogMessagePeriod />);
  fireEvent.input(screen.getByLabelText('Сообщения с даты и времени'), { target: { value: '2026-11-05T04:00' } });
  expect(changed).toHaveBeenLastCalledWith({ messageFrom: '2026-11-05T04:00:00.000+03:00', messageTo: undefined });
  fireEvent.change(screen.getByLabelText('Сообщения по дату и время'), { target: { value: '2026-11-05T04:04' } });
  expect(changed.mock.lastCall?.[0].messageTo).toBe('2026-11-05T04:04:59.999+03:00');
  fireEvent.click(screen.getByText('Сбросить период'));
  expect(changed).toHaveBeenLastCalledWith({ messageFrom: undefined, messageTo: undefined });
});
it('не отправляет перевёрнутые границы и показывает причину', () => {
  render(<DialogMessagePeriod />);
  fireEvent.change(screen.getByLabelText('Сообщения с даты и времени'), { target: { value: '2026-11-05T05:00' } });
  fireEvent.change(screen.getByLabelText('Сообщения по дату и время'), { target: { value: '2026-11-05T04:00' } });
  expect(screen.getByRole('alert')).toHaveTextContent('раньше');
  expect(changed).toHaveBeenCalledTimes(1);
});
