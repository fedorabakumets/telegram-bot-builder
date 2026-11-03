/** @fileoverview Безопасные квитанции и обёртка заявок внешних действий проекта. */
import type { Request, Response } from 'express';
import { durableAction } from '../services/action-requests/durable-action';
import { actionRequestLedger } from '../services/action-requests/default-ledger';
/** Возвращает только ID и состояние без текстов, токенов и полного проекта. */
export function externalActionReceipt(body: unknown, status: number): Record<string, unknown> {
  const value = (body && typeof body === 'object' ? body : {}) as Record<string, any>;
  if (status >= 400) return { error: 'Действие отклонено', status };
  return { state: status === 202 ? 'unknown' : 'completed',
    ...(Number.isSafeInteger(value.broadcastId) ? { broadcastId: value.broadcastId } : {}),
    ...(Number.isSafeInteger(value.campaignId) ? { campaignId: value.campaignId } : {}),
    ...(Array.isArray(value.broadcastIds) ? { broadcastIds: value.broadcastIds.filter(Number.isSafeInteger) } : {}),
    ...(Number.isSafeInteger(value.messageId ?? value.result?.result?.message_id) ? { messageId: value.messageId ?? value.result.result.message_id } : {}),
    ...(Number.isSafeInteger(value.projectId ?? value.project?.id) ? { projectId: value.projectId ?? value.project?.id } : {}),
    ...(Number.isSafeInteger(value.templateId ?? value.copiedTemplate?.id) ? { templateId: value.templateId ?? value.copiedTemplate?.id } : {}),
  };
}
/** Оборачивает действие только после middleware проверки доступа к проекту. */
export function durableProjectAction(handler: (req: Request, res: Response) => unknown | Promise<unknown>, action: string) {
  return durableAction(handler, { action, scope: req => `project:${req.params.projectId}`, ledger: actionRequestLedger, receipt: externalActionReceipt });
}
