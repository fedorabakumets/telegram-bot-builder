/**
 * @fileoverview Проверяет запрет удаления данных при неподтверждённой остановке бота.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ getBotToken: vi.fn(), deleteBotToken: vi.fn(), getBotInstancesByProject: vi.fn(), getBotTokensByProject: vi.fn(), stop: vi.fn(), broadcast: vi.fn() }));
vi.mock('../../server/storages/storage', () => ({ storage: mock }));
vi.mock('../../server/bots/stopBot', () => ({ stopBot: mock.stop }));
vi.mock('../../server/terminal/broadcastProjectEvent', () => ({ broadcastProjectEvent: mock.broadcast }));
import { deleteProjectTokenHandler } from '../../server/routes/botTokens/handlers/deleteProjectTokenHandler';
import { stopProjectBot } from '../../server/routes/projectManagement/utils/botStopper';
describe('остановка перед удалением', () => {
 beforeEach(() => { vi.clearAllMocks(); mock.getBotToken.mockResolvedValue({ id: 2, projectId: 1, name: 'Бот' }); mock.broadcast.mockResolvedValue(undefined); mock.getBotTokensByProject.mockResolvedValue([]); });
 it('не удаляет токен при success:false результата остановки', async () => {
  mock.stop.mockResolvedValue({ success: false }); const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  await deleteProjectTokenHandler({ params: { tokenId: '2', projectId: '1' } } as never, res);
  expect(res.status).toHaveBeenCalledWith(409); expect(mock.deleteBotToken).not.toHaveBeenCalled();
 });
 it('проверяет ноль удалённых строк после подтверждённой остановки', async () => {
  mock.stop.mockResolvedValue({ success: true }); mock.deleteBotToken.mockResolvedValue(false);
  const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() }; await deleteProjectTokenHandler({ params: { tokenId: '2', projectId: '1' } } as never, res);
  expect(res.status).toHaveBeenCalledWith(404);
 });
 it('останавливает все известные экземпляры проекта, а не только первый', async () => {
  mock.getBotInstancesByProject.mockResolvedValue([{ tokenId: 2, status: 'running' }, { tokenId: 3, status: 'running' }, { tokenId: 4, status: 'stopped' }]);
  mock.stop.mockResolvedValue({ success: true }); await stopProjectBot(1);
  expect(mock.stop.mock.calls).toEqual([[1, 2], [1, 3], [1, 4]]);
 });
 it('прерывает удаление проекта при неподтверждённой остановке одного экземпляра', async () => {
  mock.getBotInstancesByProject.mockResolvedValue([{ tokenId: 2, status: 'running' }]); mock.stop.mockResolvedValue({ success: false });
  await expect(stopProjectBot(1)).rejects.toThrow('не подтверждена');
 });
 it('отменяет queued/starting запуски и токены без runtime-строки', async () => {
  mock.getBotInstancesByProject.mockResolvedValue([{ tokenId: 7, status: 'starting' }]);
  mock.getBotTokensByProject.mockResolvedValue([{ id: 2, isDefault: 1 }, { id: 3, isDefault: 0 }]);
  mock.stop.mockResolvedValue({ success: true }); await stopProjectBot(1);
  expect(mock.stop.mock.calls).toEqual([[1, 2], [1, 3], [1, 7]]);
 });

});
