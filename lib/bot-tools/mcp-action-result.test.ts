/** @fileoverview Проверки совместимых статусов подготовки, ошибок и подтверждения записи. */
import { describe, expect, it } from 'vitest';
import { normalizeMcpActionResult } from './mcp-action-result';
import { getMcpActionPolicy } from './mcp-action-policy';
import { actionOutputSchema } from './mcp-output-contract';

/** Формирует старый текстовый ответ инструмента. @param value - Данные. @returns Ответ MCP. */
function response(value: unknown) { return { content: [{ type: 'text' as const, text: JSON.stringify(value) }] }; }

describe('Результаты действий MCP', () => {
  it('сохраняет legacy-массив и принимает только проверенную отдельную квитанцию проекта', () => {
    const original = { ...response([{ id: 9 }]), _meta: { persistenceProof: { confirmed: true, projectId: 7 } } };
    const saved = normalizeMcpActionResult(original, getMcpActionPolicy('db_add_table_rows'), true);
    expect(saved.content).toEqual(original.content);
    expect(saved.structuredContent).toMatchObject({ data: [{ id: 9 }],
      execution: { outcome: 'saved', persistence: { confirmed: true, projectId: 7 } } });
    expect(actionOutputSchema.safeParse(saved.structuredContent).success).toBe(true);
    for (const persistenceProof of [{ confirmed: 'true', projectId: 7 }, { confirmed: true },
      { confirmed: true, projectId: -1 }, { confirmed: true, projectId: 1.5 }]) {
      const result = normalizeMcpActionResult({ ...response([]), _meta: { persistenceProof } }, getMcpActionPolicy('db_add_table_rows'));
      expect(result._meta?.botcraft).toMatchObject({ outcome: 'unverified', persistence: { confirmed: false } });
    }
  });
  it('не меняет старые данные и отличает подготовку от сохранения', () => {
    const original = response({ project: { sheets: [] } });
    const prepared = normalizeMcpActionResult(original, getMcpActionPolicy('update_node'));
    expect(prepared.content).toEqual(original.content);
    expect(prepared._meta?.botcraft).toMatchObject({ outcome: 'prepared', persistence: { confirmed: false } });
    const unverified = normalizeMcpActionResult(response({ ok: true }), getMcpActionPolicy('db_update_node'));
    expect(unverified._meta?.botcraft).toMatchObject({ outcome: 'unverified', persistence: { confirmed: false } });
  });
  it('признаёт серверную квитанцию и явно помечает бизнес-ошибку', () => {
    const saved = normalizeMcpActionResult(response({ persistence: { confirmed: true, revision: 3 } }), getMcpActionPolicy('db_update_node'));
    expect(saved._meta?.botcraft).toMatchObject({ outcome: 'saved', persistence: { confirmed: true, revision: 3 } });
    expect(normalizeMcpActionResult(response({ error: 'Нет доступа' }), getMcpActionPolicy('db_update_node')).isError).toBe(true);
  });
  it('добавляет проверяемую оболочку, сохраняя старый текст и неизвестный исход', () => {
    const original = response({ error: 'Ответ потерян', outcome: 'unknown' });
    const normalized = normalizeMcpActionResult(original, getMcpActionPolicy('db_update_node'), true);
    expect(normalized.content).toEqual(original.content);
    expect(normalized.isError).toBe(true);
    expect(actionOutputSchema.safeParse(normalized.structuredContent).success).toBe(true);
    expect(normalized.structuredContent).toMatchObject({ execution: { outcome: 'unknown', persistence: { confirmed: false } } });
    expect(normalizeMcpActionResult(response([1, 2]), getMcpActionPolicy('db_list_projects'), true).structuredContent)
      .toMatchObject({ data: [1, 2], execution: { outcome: 'read' } });
    expect(normalizeMcpActionResult(response({ state: 'unknown', retryable: false }), getMcpActionPolicy('db_add_table_rows'))._meta?.botcraft)
      .toMatchObject({ outcome: 'unknown', persistence: { confirmed: false } });
  });
  it('отделяет preview от записи, а создание фоновой задачи от её завершения', () => {
    const preview = normalizeMcpActionResult(response({ prepared: true, saved: false }), getMcpActionPolicy('db_import_table_rows'));
    expect(preview._meta?.botcraft).toMatchObject({ outcome: 'prepared', persistence: { confirmed: false } });
    const started = normalizeMcpActionResult(response({ state: 'completed', broadcastId: 1, persistence: { confirmed: true } }),
      getMcpActionPolicy('db_start_broadcast', { botcraft: { section: 'broadcasts', effect: 'external' } }));
    expect(started._meta?.botcraft).toMatchObject({ outcome: 'pending', pollAction: 'db_get_broadcast' });
  });
});
