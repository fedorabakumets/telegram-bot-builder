/** @fileoverview Совместимые метаданные результата MCP без объявления неподтверждённой записи сохранённой. */
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { McpActionPolicy } from './mcp-action-policy';

/**
 * Извлекает объект старого JSON-ответа, сохраняя исходные content-блоки.
 * @param result - Результат обработчика.
 * @returns Данные ответа или отсутствие машиночитаемых данных.
 */
function resultData(result: CallToolResult): Record<string, unknown> | undefined {
  if (result.structuredContent) return result.structuredContent;
  const text = result.content.find(block => block.type === 'text');
  if (!text || text.type !== 'text') return undefined;
  try {
    const parsed = JSON.parse(text.text);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : undefined;
  } catch { return undefined; }
}

/**
 * Помечает бизнес-ошибки и отделяет подготовленный результат от подтверждённого сохранения.
 * @param result - Исходный результат, включая прежнюю текстовую форму.
 * @param policy - Явный эффект операции.
 * @returns Результат с дополнительным _meta.botcraft без изменения старых данных.
 */
export function normalizeMcpActionResult(result: CallToolResult, policy: McpActionPolicy, includeEnvelope = false): CallToolResult {
  const data = resultData(result);
  const failed = result.isError === true || Boolean(data?.error) || data?.ok === false || data?.success === false;
  /** Массивы legacy API передают проверенную HTTP-квитанцию отдельно от прежнего JSON content. */
  const proof = result._meta?.persistenceProof as { confirmed?: unknown; projectId?: unknown; revision?: unknown } | undefined;
  const checkedProof = proof?.confirmed === true && typeof proof.projectId === 'number'
    && Number.isSafeInteger(proof.projectId) && proof.projectId > 0 ? proof : undefined;
  const receipt = (data?.persistence ?? checkedProof) as { confirmed?: boolean; projectId?: unknown; revision?: unknown } | undefined;
  const job = data?.job as { status?: unknown } | undefined;
  const pending = policy.completionMode === 'job' || policy.effect === 'external'
    && ['pending', 'running', 'cancelling'].includes(String(job?.status ?? data?.status));
  const prepared = data?.prepared === true && data?.saved === false || data?.applied === false && data?.requiresConfirmation === true;
  const outcome = data?.outcome === 'partial' ? 'partial' : data?.outcome === 'unknown' || data?.state === 'unknown' ? 'unknown' : failed ? 'error'
    : prepared || policy.effect === 'prepare' ? 'prepared'
    : policy.effect === 'read' ? 'read'
    : pending ? 'pending'
    : receipt?.confirmed === true ? 'saved'
    : policy.effect === 'file' ? 'file_result' : 'unverified';
  const execution = { ...policy, outcome, persistence: { confirmed: receipt?.confirmed === true,
    ...(Number.isSafeInteger(receipt?.projectId) ? { projectId: receipt!.projectId } : {}),
    ...(Number.isSafeInteger(receipt?.revision) ? { revision: receipt!.revision } : {}) },
    ...(data?.sideEffects && typeof data.sideEffects === 'object' ? { sideEffects: data.sideEffects } : {}) };
  let payload: unknown = result.structuredContent ?? null;
  if (!result.structuredContent) {
    const text = result.content.find(block => block.type === 'text');
    if (text?.type === 'text') { try { payload = JSON.parse(text.text); } catch { payload = text.text; } }
  }
  return { ...result, ...(failed ? { isError: true } : {}),
    ...(includeEnvelope ? { structuredContent: { data: payload, execution } } : {}),
    _meta: { ...result._meta, botcraft: execution } };
}
