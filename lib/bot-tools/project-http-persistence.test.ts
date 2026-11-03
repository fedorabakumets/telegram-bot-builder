/**
 * @fileoverview Изолированные проверки HTTP-квитанции без рабочей БД и побочных эффектов.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
const mocks = vi.hoisted(() => ({ updateBotProject: vi.fn(), getBotProject: vi.fn(), effects: vi.fn() }));
vi.mock('../../server/storages/storage', () => ({ storage: mocks }));
vi.mock('../../server/routes/projectRoutes/handlers/project-update-effects', () => ({ runProjectUpdateEffects: mocks.effects }));
import { updateProjectHandler } from '../../server/routes/projectRoutes/handlers/updateProjectHandler';
/** Создаёт HTTP-заглушки с захватом статуса и тела. */
function request(body: Record<string, unknown>) {
 const req = { params: { id: '1' }, body } as unknown as Request;
 const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
 return { req, res };
}
describe('HTTP сохранение проекта', () => {
 beforeEach(() => vi.clearAllMocks());
 it('проверяет revision даже для обычного клиента', async () => {
  mocks.updateBotProject.mockResolvedValue({ id: 1, revision: 4, data: {} });
  mocks.effects.mockResolvedValue({ liveBroadcast: 'broadcast_attempted' });
  const { req, res } = request({ data: {}, expectedRevision: 3 });
  await updateProjectHandler(req, res);
  expect(mocks.updateBotProject).toHaveBeenCalledWith(1, { data: {} }, 3);
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ outcome: 'saved', persistence: { confirmed: true, projectId: 1, revision: 4 } }));
 });
 it('не сообщает saved при нуле изменённых строк из-за конфликта', async () => {
  mocks.updateBotProject.mockResolvedValue(undefined); mocks.getBotProject.mockResolvedValue({ id: 1, revision: 4 });
  const { req, res } = request({ data: {}, expectedRevision: 3 });
  await updateProjectHandler(req, res);
  expect(res.status).toHaveBeenCalledWith(409); expect(mocks.effects).not.toHaveBeenCalled();
 });
 it('отличает удалённый проект от конфликта', async () => {
  mocks.updateBotProject.mockResolvedValue(undefined); mocks.getBotProject.mockResolvedValue(undefined);
  const { req, res } = request({ data: {}, expectedRevision: 3 }); await updateProjectHandler(req, res);
  expect(res.status).toHaveBeenCalledWith(404);
 });
 it('сохраняет подтверждение commit при отказе сопутствующего эффекта', async () => {
  mocks.updateBotProject.mockResolvedValue({ id: 1, revision: 4 }); mocks.effects.mockRejectedValue(new Error('offline'));
  const { req, res } = request({ data: {}, expectedRevision: 3 }); await updateProjectHandler(req, res);
  expect(res.status).not.toHaveBeenCalled(); expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ outcome: 'saved', sideEffects: expect.objectContaining({ warning: expect.any(String) }) }));
 });
 it.each(['ownerId', 'sessionId', 'botToken', 'adminIds'])('не разрешает mass assignment поля %s', async (field) => {
  const { req, res } = request({ data: {}, [field]: field === 'ownerId' ? 999 : 'injected' });
  await updateProjectHandler(req, res);
  expect(res.status).toHaveBeenCalledWith(400); expect(mocks.updateBotProject).not.toHaveBeenCalled();
 });
 it('не обращается к storage при неправильной ревизии', async () => {
  const { req, res } = request({ data: {}, expectedRevision: -1 }); await updateProjectHandler(req, res);
  expect(res.status).toHaveBeenCalledWith(400); expect(mocks.updateBotProject).not.toHaveBeenCalled();
 });
});
