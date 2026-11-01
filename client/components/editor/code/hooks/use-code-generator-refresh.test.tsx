/** @fileoverview Проверка принудительного обновления файла в обход кэша генерации. */
import { act, renderHook } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { useCodeGenerator } from './use-code-generator';
import type { BotData } from '@shared/schema';

vi.mock('@tanstack/react-query', () => ({ useQuery: () => ({ data: undefined }) }));
vi.mock('@/queryClient', () => ({ apiRequest: vi.fn(async () => ({ code: 'Новый код' })) }));

it('повторно запрашивает файл только при принудительном обновлении', async () => {
  const { apiRequest } = await import('@/queryClient');
  const botData = { nodes: [], connections: [] } as unknown as BotData;
  const { result } = renderHook(() => useCodeGenerator({ botData, projectName: 'Проверка', projectId: 12 }));
  await act(async () => { await result.current.loadContent('python'); });
  await act(async () => { await result.current.loadContent('python'); });
  expect(apiRequest).toHaveBeenCalledTimes(1);
  await act(async () => { await result.current.loadContent('python', true); });
  expect(apiRequest).toHaveBeenCalledTimes(2);
  expect(result.current.codeContent.python).toBe('Новый код');
  expect(result.current.isLoading).toBe(false);
});
