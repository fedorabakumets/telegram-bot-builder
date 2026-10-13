/**
 * @fileoverview Проверки открытия, повторного выбора и отмены своего периода логов.
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TerminalPeriodPicker } from './TerminalPeriodPicker';

afterEach(cleanup);

/**
 * Открывает меню с клавиатуры и выбирает действие своего периода.
 * @returns Завершение открытия формы
 */
async function selectCustom() {
  fireEvent.keyDown(screen.getByRole('button', { name: 'Период логов' }), { key: 'Enter' });
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Свой период…' }));
  await screen.findByLabelText('От');
}

/**
 * Создаёт абсолютный диапазон по локальным датам тестового окружения.
 * @returns Диапазон для формы
 */
function exampleRange() {
  return {
    from: new Date('2026-10-10T10:00').toISOString(),
    to: new Date('2026-10-10T12:00').toISOString(),
  };
}

describe('TerminalPeriodPicker', () => {
  it('открывает форму из меню с текущими датами и сохраняет период до применения', async () => {
    const onChange = vi.fn();
    const onCustomRange = vi.fn();
    render(<TerminalPeriodPicker period="yesterday" range={exampleRange()} onChange={onChange} onCustomRange={onCustomRange} />);
    await selectCustom();
    expect(screen.getByLabelText('От')).toHaveValue('2026-10-10T10:00');
    expect(screen.getByLabelText('До')).toHaveValue('2026-10-10T12:00');
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Применить' }));
    expect(onCustomRange).toHaveBeenCalledWith(exampleRange());
    await waitFor(() => expect(screen.queryByLabelText('От')).not.toBeInTheDocument());
  });

  it('повторно открывает уже выбранный свой период и отменяет черновые даты', async () => {
    const onCustomRange = vi.fn();
    render(<TerminalPeriodPicker period="custom" range={exampleRange()} onChange={vi.fn()} onCustomRange={onCustomRange} />);
    await selectCustom();
    fireEvent.change(screen.getByLabelText('От'), { target: { value: '2026-10-09T09:00' } });
    fireEvent.keyDown(screen.getByLabelText('От'), { key: 'Escape' });
    await waitFor(() => expect(screen.queryByLabelText('От')).not.toBeInTheDocument());
    await selectCustom();
    expect(screen.getByLabelText('От')).toHaveValue('2026-10-10T10:00');
    expect(onCustomRange).not.toHaveBeenCalled();
  });

  it('даёт начальные даты для живых логов и блокирует неверный диапазон', async () => {
    render(<TerminalPeriodPicker period="live" range={null} onChange={vi.fn()} onCustomRange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Настроить период' }));
    expect(await screen.findByLabelText('От')).not.toHaveValue('');
    fireEvent.change(screen.getByLabelText('От'), { target: { value: '2026-10-10T12:00' } });
    fireEvent.change(screen.getByLabelText('До'), { target: { value: '2026-10-10T10:00' } });
    expect(screen.getByRole('button', { name: 'Применить' })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('Окончание должно быть позже начала.');
  });
});
