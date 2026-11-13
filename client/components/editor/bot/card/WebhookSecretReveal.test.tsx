/** @fileoverview Проверки явного раскрытия секрета и удаления значения при смене бота. */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { WebhookSecretReveal } from './WebhookSecretReveal';
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it('не запрашивает секрет до нажатия и сбрасывает значение при смене бота', async () => {
  const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ value: 'private_webhook' }) });
  vi.stubGlobal('fetch', fetch);
  const { rerender } = render(<WebhookSecretReveal projectId={12} tokenId={58} available />);
  expect(fetch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText('Показать токен'));
  await waitFor(() => expect(screen.getByText('private_webhook')).toBeTruthy());
  expect(fetch.mock.calls[0][1].cache).toBe('no-store');
  rerender(<WebhookSecretReveal projectId={12} tokenId={59} available />);
  expect(screen.queryByText('private_webhook')).toBeNull();
});

it('не позволяет запрос без подтверждения существования секрета', () => {
  render(<WebhookSecretReveal projectId={12} tokenId={58} available={false} />);
  expect(screen.getByText('Показать токен')).toHaveProperty('disabled', true);
});
