/**
 * @fileoverview Проверяет запрет изменения владельца и проекта в обычном PUT токена.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ getBotProject: vi.fn(), getBotToken: vi.fn(), hasProjectAccess: vi.fn(), updateBotToken: vi.fn(), emit: vi.fn(), owner: 1 as number | null }));
vi.mock('../../server/storages/storage', () => ({ storage: mock }));
vi.mock('../../server/telegram/auth-middleware', () => ({ getOwnerIdFromRequest: () => mock.owner }));
vi.mock('../../server/terminal', () => ({ emitTokenUpdated: mock.emit }));
import { updateProjectTokenHandler } from '../../server/routes/botTokens/handlers/updateProjectTokenHandler';
/** Формирует заглушки запроса и ответа. */
function request(body: unknown) { const req = { params: { id: '1', tokenId: '2' }, body }; const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() }; return { req: req as never, res }; }
describe('безопасное обновление токена', () => {
 beforeEach(() => { vi.clearAllMocks(); mock.owner = 1; mock.getBotProject.mockResolvedValue({ id: 1 }); mock.hasProjectAccess.mockResolvedValue(true); mock.getBotToken.mockResolvedValue({ id: 2, projectId: 1 }); mock.emit.mockResolvedValue(undefined); });
 it.each(['ownerId', 'projectId', 'userbotSessionString', 'totalExecutionSeconds', 'botUsername'])('отклоняет %s до запросов к storage', async (field) => {
  const { req, res } = request({ name: 'Новый', [field]: 99 }); await updateProjectTokenHandler(req, res);
  expect(res.status).toHaveBeenCalledWith(400); expect(mock.getBotProject).not.toHaveBeenCalled(); expect(mock.updateBotToken).not.toHaveBeenCalled();
 });
 it('не обновляет токен другого проекта даже у коллаборатора', async () => {
  mock.getBotToken.mockResolvedValue({ id: 2, projectId: 999 }); const { req, res } = request({ name: 'Новый' }); await updateProjectTokenHandler(req, res);
  expect(res.status).toHaveBeenCalledWith(404); expect(mock.updateBotToken).not.toHaveBeenCalled();
 });
 it('не сообщает сохранение при нуле обновлённых строк', async () => {
  mock.updateBotToken.mockResolvedValue(undefined); const { req, res } = request({ name: 'Новый' }); await updateProjectTokenHandler(req, res);
  expect(res.status).toHaveBeenCalledWith(404); expect(mock.emit).not.toHaveBeenCalled();
 });
 it('возвращает подтверждение совпадения нового секрета без его содержимого', async () => {
  const secret = `123456789:${'a'.repeat(35)}`;
  mock.updateBotToken.mockResolvedValue({ id: 2, projectId: 1, token: secret });
  const { req, res } = request({ token: secret }); await updateProjectTokenHandler(req, res);
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ persistence: expect.objectContaining({ confirmed: true, secretMatched: true }) }));
  expect(JSON.stringify(res.json.mock.calls[0][0])).not.toContain(secret);
 });
});
