/** @fileoverview Проверка дрейфа сгенерированных контрактов относительно реальных регистраций SDK. */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readMcpDefinitions } from '../../tools/mcp-catalog/read-definitions';

describe('Сгенерированная документация MCP', () => {
  it('содержит актуальные схемы и одинаковые карточки для документации и runtime', async () => {
    const current = await readMcpDefinitions(true);
    const saved = JSON.parse(await readFile(join(process.cwd(), 'docs/mcp/action-catalog.json'), 'utf8'));
    expect(saved.actions.map((action: { id: string }) => action.id)).toEqual(current.map(action => action.id));
    for (const action of current) {
      const stored = saved.actions.find((item: { id: string }) => item.id === action.id);
      expect(stored.inputSchema).toEqual(JSON.parse(JSON.stringify(action.inputSchema)));
      expect(stored.outputSchema).toEqual(JSON.parse(JSON.stringify(action.outputSchema)));
      expect(stored.policy).toEqual(action.policy);
      const docs = await readFile(join(process.cwd(), 'docs/mcp/tools', `${action.id}.md`), 'utf8');
      const runtime = await readFile(join(process.cwd(), 'lib/generated/mcp-docs/tools', `${action.id}.md`), 'utf8');
      expect(runtime).toBe(docs);
      expect(docs).toContain('## Параметры');
    }
  });
});
