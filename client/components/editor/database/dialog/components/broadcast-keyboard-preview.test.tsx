/** @fileoverview Проверка видимости ссылок и раскладки клавиатуры в ленте рассылок. */
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { BroadcastKeyboardPreview } from './broadcast-keyboard-preview';

afterEach(cleanup);

it('показывает сохранённую кнопку поддержки с её адресом', () => {
  render(<BroadcastKeyboardPreview broadcastId={40} buttonsPerRow={1}
    buttons={[{ text: 'Открыть поддержку', action: 'url', url: 'https://torlink.life/support' }]} />);
  expect(screen.getByRole('link', { name: 'Открыть поддержку' })).toHaveAttribute('href', 'https://torlink.life/support');
});

it('сохраняет ряды кнопок и не выводит пустую клавиатуру', () => {
  const buttons = Array.from({ length: 5 }, (_, i) => ({ text: `Кнопка ${i}` }));
  const { container, rerender } = render(<BroadcastKeyboardPreview broadcastId={40} buttons={buttons} buttonsPerRow={2} />);
  expect(Array.from(container.querySelectorAll('.dialog-message-buttons')).map(row => row.children.length)).toEqual([2, 2, 1]);
  rerender(<BroadcastKeyboardPreview broadcastId={40} buttons={null} />);
  expect(screen.queryByLabelText('Кнопки рассылки')).not.toBeInTheDocument();
});
