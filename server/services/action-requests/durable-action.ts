/** @fileoverview Обёртка авторизованных JSON-обработчиков с постоянными квитанциями и запретом неоднозначного повтора. */
import type { Request, Response, RequestHandler } from 'express';
import { actionRequestIdSchema } from '../../../shared/action-request-id';
import { ActionRequestLedger, actionRequestHash, type ActionRequestKey } from './ledger';
/** Настройки действия; проверка доступа обязана выполняться до обёртки. */
export interface DurableActionOptions {
  /** Стабильное имя действия. */
  action: string;
  /** Авторизованная область; для шаблона включает текущего владельца. */
  scope(req: Request): string;
  /** Постоянный журнал с автокоммитом. */
  ledger: ActionRequestLedger;
  /** Формирует разрешённую квитанцию, исключая секреты и полное тело проекта. */
  receipt(body: unknown, status: number): unknown;
}
/** Ответ при ещё выполняющейся либо прерванной попытке. @param requestId - Заявка. @param receipt - Частичный результат. @returns Безопасный ответ. */
function pending(requestId: string, receipt?: unknown) {
  return { requestId, state: 'unknown', retryable: false, receipt: receipt ?? null,
    message: 'Исход действия требует сверки. Повторное выполнение автоматически запрещено.' };
}
/**
 * Оборачивает конечный JSON-обработчик после авторизации; старые запросы без requestId сохраняют прежнее поведение.
 * Для нескольких шагов обработчик может await res.locals.actionRequestCheckpoint(безопаснаяКвитанция).
 * @param handler - Обработчик без передачи управления следующему middleware.
 * @param options - Область, журнал и разрешённый результат.
 * @returns Обработчик, ожидающий фиксацию квитанции до ответа клиенту.
 */
export function durableAction(handler: (req: Request, res: Response) => unknown | Promise<unknown>, options: DurableActionOptions): RequestHandler {
  return async (req, res) => {
    const requestId = req.body?.requestId;
    if (requestId === undefined) { await handler(req, res); return; }
    if (!actionRequestIdSchema.safeParse(requestId).success) { res.status(400).json({ message: 'Неверный requestId' }); return; }
    const key: ActionRequestKey = { scope: options.scope(req), action: options.action, requestId };
    const { requestId: omitted, ...body } = req.body;
    const hash = actionRequestHash({ params: req.params, query: req.query, body });
    let claim;
    try { claim = await options.ledger.claim(key, hash); }
    catch { res.status(503).json({ message: 'Журнал заявок недоступен; действие не выполнялось' }); return; }
    if (!claim.acquired) {
      const record = claim.record!;
      if (record.request_hash !== hash) { res.status(409).json({ message: 'requestId уже использован с другими аргументами' }); return; }
      if (record.state === 'completed') { res.status(record.status!).json(record.receipt); return; }
      res.status(202).json(pending(requestId, record.receipt)); return;
    }
    const originalJson = res.json;
    let captured: unknown;
    let responded = false;
    let partial: unknown;
    res.locals.actionRequestCheckpoint = async (receipt: unknown) => {
      partial = options.receipt(receipt, 202);
      await options.ledger.checkpoint(key, partial);
    };
    res.json = function (value: unknown) { captured = value; responded = true; return res; };
    try {
      await handler(req, res);
      if (!responded || res.headersSent) throw new Error('Обработчик не вернул отложенный JSON');
      const status = res.statusCode;
      if (status >= 500 || (status >= 400 && partial !== undefined)) throw new Error('Неопределённый исход обработчика');
      const receipt = options.receipt(captured, status);
      await options.ledger.complete(key, status, receipt);
      res.json = originalJson;
      res.status(status).json(receipt);
    } catch {
      res.json = originalJson;
      await options.ledger.unknown(key).catch(() => undefined);
      if (!res.headersSent) res.status(202).json(pending(requestId, partial));
    } finally {
      res.json = originalJson;
      delete res.locals.actionRequestCheckpoint;
    }
  };
}
