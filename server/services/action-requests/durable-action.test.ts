/** @fileoverview Проверки квитанций и неопределённого исхода обработчиков без внешних вызовов. */
import { describe, expect, it, vi } from 'vitest';
import { durableAction } from './durable-action';
import type { ActionRequestLedger } from './ledger';
/** Создаёт изолированный ответ Express. @returns Ответ и собранные данные. */
function response() {
  const result: any = { locals: {}, statusCode: 200, headersSent: false };
  result.status = (status: number) => { result.statusCode = status; return result; };
  result.json = (body: unknown) => { result.body = body; return result; };
  return result;
}
/** Формирует запрос с фиксированным идентификатором. @returns Запрос. */
function request() { return { body: { requestId: '23701e46-e727-40fd-af09-7923df80af01', text: 'secret' }, params: { projectId: '1' }, query: { tokenId: '2' } } as any; }
/** Создаёт журнал-заглушку. @returns Журнал. */
function ledger() { return { claim: vi.fn().mockResolvedValue({ acquired: true }), complete: vi.fn().mockResolvedValue(undefined), unknown: vi.fn().mockResolvedValue(undefined), checkpoint: vi.fn().mockResolvedValue(undefined) }; }
/** Собирает параметры обёртки. @param store - Журнал. @returns Настройки. */
function options(store: ReturnType<typeof ledger>) { return { action: 'send', scope: () => 'project:1', ledger: store as unknown as ActionRequestLedger, receipt: (body: any) => ({ messageId: body.messageId }) }; }
describe('отложенный ответ действия', () => {
  it('не отправляет ответ до квитанции и не сохраняет секреты', async () => {
    const store = ledger(); const res = response();
    store.complete.mockImplementation(async () => { expect(res.body).toBeUndefined(); });
    const handler = durableAction(async (_req, out) => { out.status(201).json({ messageId: 12, token: 'secret' }); }, options(store));
    await handler(request(), res, vi.fn());
    expect(res.body).toEqual({ messageId: 12 }); expect(store.complete).toHaveBeenCalledWith(expect.anything(), 201, { messageId: 12 });
  });
  it('ошибка фиксации после отправки эффекта не вызывает повтор обработчика', async () => {
    const store = ledger(); store.complete.mockRejectedValue(new Error('lost commit reply'));
    const execute = vi.fn(async (_req, out) => { out.json({ messageId: 12 }); });
    const handler = durableAction(execute, options(store)); const res = response();
    await handler(request(), res, vi.fn());
    expect(execute).toHaveBeenCalledTimes(1); expect(res.statusCode).toBe(202); expect(res.body.retryable).toBe(false);
    expect(store.unknown).toHaveBeenCalled();
  });
  it('replay pending и изменённое тело не исполняют обработчик', async () => {
    const store = ledger(); const execute = vi.fn(); const req = request(); const handler = durableAction(execute, options(store));
    await handler(req, response(), vi.fn());
    const hash = store.claim.mock.calls[0][1];
    store.claim.mockResolvedValue({ acquired: false, record: { request_hash: hash, state: 'pending', receipt: { projectId: 2 } } });
    const res = response(); await handler(req, res, vi.fn()); expect(res.statusCode).toBe(202);
    store.claim.mockResolvedValue({ acquired: false, record: { request_hash: 'different' } });
    const changed = response(); await handler(req, changed, vi.fn()); expect(changed.statusCode).toBe(409);
    expect(execute).toHaveBeenCalledTimes(1);
  });
  it('недоступный журнал блокирует эффект, а старый запрос остаётся совместимым', async () => {
    const store = ledger(); store.claim.mockRejectedValue(new Error('offline'));
    const execute = vi.fn(async (_req, out) => out.json({ legacy: true })); const handler = durableAction(execute, options(store));
    const blocked = response(); await handler(request(), blocked, vi.fn()); expect(blocked.statusCode).toBe(503); expect(execute).not.toHaveBeenCalled();
    const req = request(); delete req.body.requestId; const legacy = response(); await handler(req, legacy, vi.fn()); expect(legacy.body).toEqual({ legacy: true });
  });
  it('возвращает сохранённую квитанцию без повторной отправки', async () => {
    const store = ledger(); const execute = vi.fn(); const req = request(); const handler = durableAction(execute, options(store));
    await handler(req, response(), vi.fn()); const hash = store.claim.mock.calls[0][1]; execute.mockClear();
    store.claim.mockResolvedValue({ acquired: false, record: { request_hash: hash, state: 'completed', status: 201, receipt: { messageId: 12 } } });
    const res = response(); await handler(req, res, vi.fn());
    expect(res.statusCode).toBe(201); expect(res.body).toEqual({ messageId: 12 }); expect(execute).not.toHaveBeenCalled();
  });
  it('сохраняет частичный результат и не выдаёт частичную операцию за окончательную ошибку', async () => {
    const store = ledger(); const res = response();
    const config = { ...options(store), receipt: (body: any) => ({ projectId: body.projectId }) };
    const handler = durableAction(async (_req, out) => {
      await out.locals.actionRequestCheckpoint({ projectId: 8, token: 'secret' });
      out.status(500).json({ error: 'copy failed' });
    }, config);
    await handler(request(), res, vi.fn());
    expect(store.checkpoint).toHaveBeenCalledWith(expect.anything(), { projectId: 8 });
    expect(store.complete).not.toHaveBeenCalled(); expect(res.body.receipt).toEqual({ projectId: 8 }); expect(res.statusCode).toBe(202);
  });
  it('невалидный идентификатор отклоняется до захвата и эффекта', async () => {
    const store = ledger(); const execute = vi.fn(); const req = request(); req.body.requestId = 'not-uuid';
    const res = response(); await durableAction(execute, options(store))(req, res, vi.fn());
    expect(res.statusCode).toBe(400); expect(store.claim).not.toHaveBeenCalled(); expect(execute).not.toHaveBeenCalled();
  });
});
