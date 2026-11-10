/** @fileoverview Проверка реального POST повторной рассылки только проверенным группам. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCreateBroadcast } from '../hooks/use-create-broadcast';
import type { NewBroadcastFormData } from '../types';

const mocks = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('@tanstack/react-query', () => ({ useMutation: (options: unknown) => options }));
vi.mock('@/queryClient', () => ({ apiRequest: mocks.request }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));

/**
 * Создаёт форму с результатами проверенной групповой аудитории.
 * @returns Форма повторной отправки
 */
function form(): NewBroadcastFormData {
  return { name: '', messageText: 'Повтор', mediaUrls: [], tokenIds: [11],
    filters: { audienceType: 'retry', retryBroadcastId: 7, userIds: [] },
    groupsByTokenId: { 11: ['-1001'] },
    retryAudience: { tokenId: 11, broadcastId: 7, userIds: [], groupIds: ['-1001'] } };
}

/**
 * Получает функцию отправки из хука с подменённым транспортом.
 * @returns Функция создания рассылки
 */
function mutation() {
  return (useCreateBroadcast({ projectId: 12 }) as unknown as {
    /** Обработчик отправки формы. */
    mutationFn: (data: NewBroadcastFormData) => Promise<unknown>;
  }).mutationFn;
}

describe('Отправка повторной групповой аудитории', () => {
  beforeEach(() => mocks.request.mockReset());
  it('сохраняет пустой userIds, чтобы не рассылать всем пользователям', async () => {
    await mutation()(form());
    expect(mocks.request).toHaveBeenCalledWith('POST', '/api/projects/12/broadcasts', expect.objectContaining({
      filters: { userIds: [] }, tokenIds: [11], groupsByTokenId: { 11: ['-1001'] },
    }));
  });
  it('отправляет смешанную аудиторию без служебных полей формы', async () => {
    const data = form(); data.filters.userIds = ['123']; data.retryAudience!.userIds = ['123'];
    await mutation()(data);
    const payload = mocks.request.mock.calls[0][2];
    expect(payload.filters).toEqual({ userIds: ['123'] });
    expect(payload).not.toHaveProperty('retryAudience');
    expect(payload.groupsByTokenId).toEqual({ 11: ['-1001'] });
  });
  it('не выполняет запрос при подмешанной или пустой аудитории', async () => {
    const foreign = form(); foreign.groupsByTokenId = { 11: ['-1001'], 12: ['-1002'] };
    const empty = form(); empty.groupsByTokenId = {}; empty.retryAudience!.groupIds = [];
    for (const data of [foreign, empty]) await expect(mutation()(data)).rejects.toThrow();
    expect(mocks.request).not.toHaveBeenCalled();
  });
});
