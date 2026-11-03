/**
 * @fileoverview Ответ MCP для таблиц: ошибка помечается isError
 * @module lib/bot-tools/mcp-table-result
 */
import { TABLE_PERSISTENCE_PROOF } from './table-persistence-proof';

/**
 * Упаковывает JSON в текстовый блок MCP
 * @param data - Данные или объект с error
 * @returns Результат инструмента
 */
export function tableToolResult(data: unknown) {
  const isError = Boolean(data) && typeof data === 'object' && 'error' in (data as object);
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
    ...(isError ? { isError: true } : {}),
    ...(data && typeof data === 'object' && TABLE_PERSISTENCE_PROOF in data ? { _meta: { persistenceProof: (data as { [TABLE_PERSISTENCE_PROOF]: unknown })[TABLE_PERSISTENCE_PROOF] } } : {}),
  };
}
