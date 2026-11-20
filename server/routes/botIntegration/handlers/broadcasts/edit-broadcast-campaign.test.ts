/** @fileoverview Проверки итогов кампании и независимой правки дочерних рассылок без сети. */
import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ load: vi.fn(), children: vi.fn(), update: vi.fn(), edit: vi.fn() }));
vi.mock('./load-project-campaign', () => ({ loadProjectCampaign: mocks.load }));
vi.mock('./edit-broadcast-messages', () => ({ editBroadcastMessages: mocks.edit }));
vi.mock('../../../../storages/storage', () => ({ storage: {
  getBroadcastsByCampaignId: mocks.children, updateBroadcastCampaign: mocks.update,
} }));
import { editBroadcastCampaignHandler } from './editBroadcastCampaignHandler';
import { emptyBroadcastEditStats } from './broadcast-edit-state';

/** Выполняет запрос и возвращает записанный ответ HTTP. */
async function request() {
  const response = { json: vi.fn(), status: vi.fn() };
  response.status.mockReturnValue(response);
  await editBroadcastCampaignHandler({ body: { messageText: 'Новый текст' } } as Request, response as unknown as Response);
  return response;
}

describe('Правка кампании с несколькими ботами', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.load.mockResolvedValue({ projectId: 13, campaign: { id: 9 } });
    mocks.children.mockResolvedValue([
      { id: 40, tokenId: 11, status: 'done', buttons: [{ id: 'support', text: 'Поддержка' }] },
      { id: 41, tokenId: 12, status: 'done', buttons: [{ id: 'other', text: 'Другая кнопка' }] },
    ]);
    mocks.edit.mockResolvedValue({ ...emptyBroadcastEditStats(), attempted: 1, edited: 1 });
    mocks.update.mockResolvedValue(undefined);
  });
  it('передаёт каждому боту его дочернюю рассылку с собственной клавиатурой', async () => {
    mocks.edit.mockResolvedValueOnce({ ...emptyBroadcastEditStats(), attempted: 2, edited: 1, unchanged: 1 });
    const response = await request();
    expect(mocks.edit.mock.calls).toEqual([[13, 40, 11, 'Новый текст'], [13, 41, 12, 'Новый текст']]);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true, attempted: 3, edited: 2, unchanged: 1,
      perBot: [expect.objectContaining({ broadcastId: 40, tokenId: 11 }), expect.objectContaining({ broadcastId: 41, tokenId: 12 })] }));
    expect(mocks.update).toHaveBeenCalledExactlyOnceWith(9, { messageText: 'Новый текст' });
  });
  it('при частичном отказе не переписывает общий текст и сохраняет итоги каждого бота', async () => {
    mocks.edit.mockResolvedValueOnce({ ...emptyBroadcastEditStats(), attempted: 2, edited: 1, failed: 1 });
    const response = await request();
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ ok: false, outcome: 'partial', attempted: 3, edited: 2, failed: 1,
      persistence: { confirmed: false, failed: 0 }, perBot: expect.arrayContaining([expect.objectContaining({ broadcastId: 40, failed: 1 })]) }));
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it('не теряет подтверждённые правки при сбое финальной записи кампании', async () => {
    mocks.update.mockRejectedValue(new Error('Сбой базы'));
    const response = await request();
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ ok: false, outcome: 'partial', edited: 2, failed: 0,
      persistenceFailed: 1, persistence: { confirmed: false, failed: 1 } }));
    expect(mocks.edit).toHaveBeenCalledTimes(2);
  });
  it('сохраняет результат первого бота при исключении второго и не повторяет отправку', async () => {
    mocks.edit.mockResolvedValueOnce({ ...emptyBroadcastEditStats(), attempted: 1, edited: 1 })
      .mockRejectedValueOnce(new Error('Сбой второй рассылки'));
    const response = await request();
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ edited: 1, unknown: 1, outcome: 'partial',
      perBot: [expect.objectContaining({ broadcastId: 40, edited: 1 }), expect.objectContaining({ broadcastId: 41, unknown: 1, error: expect.any(String) })] }));
    expect(mocks.edit).toHaveBeenCalledTimes(2);
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
