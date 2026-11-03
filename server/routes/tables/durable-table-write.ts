/** @fileoverview Повторяемые записи таблиц с квитанциями идентификаторов без сохранения содержимого ячеек. */
import type { RequestHandler } from 'express';
import { durableAction } from '../../services/action-requests/durable-action';
import type { ActionRequestLedger } from '../../services/action-requests/ledger';
import { ownedTable } from './owned-table';
/**
 * Оборачивает маршрут после проверки проекта; requestId включает новый формат квитанции.
 * @param action - Стабильное имя операции.
 * @param handler - Конечный обработчик HTTP.
 * @param ledger - Изолированный журнал для тестов; рабочий загружается при первом запросе.
 * @returns Обработчик без повторного выполнения неопределённой заявки.
 */
export function durableTableWrite(action: string, handler: RequestHandler, ledger?: ActionRequestLedger): RequestHandler {
  return async (req, res, next) => {
    if (req.body?.requestId === undefined) { await handler(req, res, next); return; }
    if (req.params.tableId && !await ownedTable(req, res)) return;
    const journal = ledger ?? (await import('../../services/action-requests/default-ledger')).actionRequestLedger;
    const original = res.json;
    /** Не позволяет заголовку уже выполненного шага подтвердить незаписанную квитанцию. */
    res.json = function (body: any) {
      if (body?.state === 'unknown') res.removeHeader('x-botcraft-persistence');
      return original.call(this, body);
    };
    try {
      await durableAction((request, response) => handler(request, response, next), {
        action: `tables.${action}`, scope: request => `project:${request.params.id}`, ledger: journal,
        receipt: (body: any, status) => {
          if (status >= 400) return { requestId: req.body.requestId, message: typeof body?.message === 'string' ? body.message.slice(0, 300) : 'Запись отклонена', ...(Number.isSafeInteger(body?.failed_op_index) ? { failed_op_index: body.failed_op_index } : {}) };
          const ids: number[] = [];
          /** Собирает только числовые идентификаторы, не содержимое и не имена. */
          const collect = (value: any): void => {
            if (Array.isArray(value)) { value.forEach(collect); return; }
            if (!value || typeof value !== 'object') return;
            for (const key of ['id', 'tableId', 'rowId', 'columnId']) if (Number.isSafeInteger(value[key]) && value[key] > 0) ids.push(value[key]);
            for (const key of ['results', 'tables', 'rows']) if (Array.isArray(value[key])) collect(value[key]);
          };
          collect(body);
          const header = res.getHeader('x-botcraft-persistence');
          const proof = body?.persistence ?? (typeof header === 'string' ? JSON.parse(header) : undefined);
          return { requestId: req.body.requestId, state: 'completed', receipt: { ids: [...new Set(ids)].slice(0, 500), idsTruncated: ids.length > 500 }, ...(proof?.confirmed === true ? { persistence: proof } : {}) };
        },
      })(req, res, next);
    } finally { res.json = original; }
  };
}
