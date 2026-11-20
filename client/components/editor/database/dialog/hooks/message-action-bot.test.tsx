/** @fileoverview Действия общей ленты используют бота сообщения, а не текущего отправителя. */
import { createElement, type ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDeleteMessage } from './use-delete-message';
import { useEditMessage } from './use-edit-message';

vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));

/** Создаёт отдельный кэш для безопасной проверки мутаций без Telegram. */
function wrapper({ children }: { /** Содержимое проверки. */ children: ReactNode }) {
  return createElement(QueryClientProvider, { client: new QueryClient({ defaultOptions: { mutations: { retry: false } } }) }, children);
}

afterEach(() => vi.unstubAllGlobals());

describe('бот исходного сообщения', () => {
  it('удаляет через бота строки, даже если ответ выбран от другого бота', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, deletedFromTelegram: true }) });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useDeleteMessage({ projectId: 12, selectedTokenId: 9,
      resolveMessageTokenId: () => 7, onOptimisticRemove: vi.fn(), onRollback: vi.fn() }), { wrapper });
    await act(async () => { await result.current.mutateAsync(123); });
    expect(fetchMock).toHaveBeenCalledWith('/api/projects/12/messages/123?tokenId=7', expect.objectContaining({ method: 'DELETE' }));
  });

  it('редактирует через бота строки, сохраняя текущего отправителя ответа', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, editedInTelegram: true }) });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useEditMessage({ projectId: 12, selectedTokenId: 9,
      resolveMessageTokenId: () => 7, onOptimisticEdit: vi.fn(), onRollback: vi.fn() }), { wrapper });
    await act(async () => { await result.current.mutateAsync({ messageId: 123, messageText: 'Новый текст', originalText: 'Текст' }); });
    expect(fetchMock).toHaveBeenCalledWith('/api/projects/12/messages/123?tokenId=7', expect.objectContaining({ method: 'PATCH' }));
  });
});
