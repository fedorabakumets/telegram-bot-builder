/** @fileoverview Реальный обработчик копирования шаблона: auth до ledger и durable частичный результат. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTemplateHandler } from '../../server/routes/templates/handlers/useTemplateHandler';
const mocks = vi.hoisted(() => ({ owner: vi.fn(), visible: vi.fn(), template: vi.fn(), increment: vi.fn(), project: vi.fn(), copy: vi.fn(), claim: vi.fn(), checkpoint: vi.fn(), complete: vi.fn(), unknown: vi.fn() }));
vi.mock('../../server/routes/templates/template-access', () => ({ assertOwnerId: mocks.owner, canViewOrUseTemplate: mocks.visible, parseTemplateId: () => 1 }));
vi.mock('../../server/storages/storage', () => ({ storage: { getBotTemplate: mocks.template, incrementTemplateUseCount: mocks.increment, createBotProject: mocks.project, createBotTemplate: mocks.copy } }));
vi.mock('../../server/services/action-requests/default-ledger', () => ({ actionRequestLedger: { claim: mocks.claim, checkpoint: mocks.checkpoint, complete: mocks.complete, unknown: mocks.unknown } }));
/** Создаёт HTTP ответ с настоящими statusCode/locals. */
function response() {
  const res: any = { statusCode: 200, locals: {}, headersSent: false, json: vi.fn(), status(code: number) { this.statusCode = code; return this; } };
  return res;
}
/** Постоянная заявка одной попытки копирования. */
const request = { params: { id: '1' }, query: {}, body: { requestId: '11111111-1111-4111-8111-111111111111' } };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.owner.mockReturnValue(7); mocks.visible.mockReturnValue(true);
  mocks.template.mockResolvedValue({ id: 1, ownerId: 7, name: 'Пример', data: {}, category: 'custom' });
  mocks.project.mockResolvedValue({ id: 5 });
});
describe('Копирование шаблона через реальный HTTP handler', () => {
  it('фиксирует созданный проект до ошибки privatecopy и не повторяет создание', async () => {
    let record: any;
    mocks.claim.mockImplementation(async (_key, hash) => record ? { acquired: false, record } : (record = { request_hash: hash, state: 'pending' }, { acquired: true }));
    mocks.checkpoint.mockImplementation(async (_key, receipt) => { record.receipt = receipt; });
    mocks.unknown.mockImplementation(async () => { record.state = 'unknown'; });
    mocks.copy.mockRejectedValue(new Error('private copy storage failure'));
    const first = response();
    await useTemplateHandler(request as never, first);
    expect(first.statusCode).toBe(202);
    expect(first.json).toHaveBeenCalledWith(expect.objectContaining({ state: 'unknown', receipt: expect.objectContaining({ projectId: 5 }), retryable: false }));
    expect(mocks.checkpoint).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ projectId: 5 }));
    expect(mocks.complete).not.toHaveBeenCalled();
    const replay = response();
    await useTemplateHandler(request as never, replay);
    expect(replay.statusCode).toBe(202);
    expect(mocks.project).toHaveBeenCalledTimes(1);
    expect(mocks.copy).toHaveBeenCalledTimes(1);
    expect(mocks.increment).toHaveBeenCalledTimes(1);
  });
  it.each(['guest', 'private'])('отказывает %s до claim и любых изменений', async mode => {
    if (mode === 'guest') mocks.owner.mockReturnValue(null);
    else mocks.visible.mockReturnValue(false);
    const res = response();
    await useTemplateHandler(request as never, res);
    if (mode === 'private') expect(res.statusCode).toBe(403);
    expect(mocks.claim).not.toHaveBeenCalled();
    expect(mocks.project).not.toHaveBeenCalled();
    expect(mocks.copy).not.toHaveBeenCalled();
    expect(mocks.increment).not.toHaveBeenCalled();
  });
});
