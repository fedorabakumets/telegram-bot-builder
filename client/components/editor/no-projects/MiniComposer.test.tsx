/** @fileoverview Проверки отправки в поддержку и сохранения черновика в форме Mini. */
import { QueryClient, QueryClientProvider, useMutation } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import type { SupportComposerPayload } from '@/components/support/post-support-message';
import { MiniComposer } from './MiniComposer';

const send = vi.hoisted(() => vi.fn<(payload: SupportComposerPayload) => Promise<void>>());

vi.mock('@/components/support/hooks/use-support-chat', () => ({
  /** Сохраняет реальные состояния мутации, подменяя её сетевое действие. */
  useSendSupportMessage: () => useMutation({ mutationFn: send, retry: false }),
}));

/** Открывает форму с изолированным кешем и возвращает поле сообщения. */
function openComposer(): HTMLInputElement {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MiniComposer onClose={vi.fn()} />
    </QueryClientProvider>,
  );
  return screen.getByRole<HTMLInputElement>('textbox', { name: 'Написать в поддержку' });
}

beforeEach(() => {
  send.mockReset();
});

it('отправляет введённый текст в поддержку, очищает поле и подтверждает отправку', async () => {
  send.mockResolvedValueOnce(undefined);
  const input = openComposer();
  fireEvent.change(input, { target: { value: '  Как перенести бота?  ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Отправить в поддержку' }));

  await screen.findByText('Сообщение отправлено в поддержку.');
  expect(send.mock.calls[0][0]).toEqual({ text: 'Как перенести бота?', files: [] });
  expect(input.value).toBe('');
});

it('оставляет черновик при ошибке и позволяет отправить его повторно', async () => {
  send.mockRejectedValueOnce(new Error('Соединение прервано')).mockResolvedValueOnce(undefined);
  const input = openComposer();
  const text = 'Подскажите, как перенести сценарий';
  const button = screen.getByRole('button', { name: 'Отправить в поддержку' });
  fireEvent.change(input, { target: { value: text } });
  fireEvent.click(button);

  await screen.findByText('Не удалось отправить сообщение. Попробуйте ещё раз.');
  expect(input.value).toBe(text);
  fireEvent.click(button);
  await screen.findByText('Сообщение отправлено в поддержку.');
  expect(send.mock.calls[1][0]).toEqual({ text, files: [] });
  expect(input.value).toBe('');
});
