/** @fileoverview Проверки явных эффектов MCP без предположений по префиксам. */
import { describe, expect, it } from 'vitest';
import { getMcpActionPolicy } from './mcp-action-policy';

describe('Политики действий MCP', () => {
  it('отличает подготовку сценария от записи и чтения аналитики', () => {
    expect(getMcpActionPolicy('update_node')).toMatchObject({ effect: 'prepare', section: 'scenario' });
    expect(getMcpActionPolicy('db_update_node')).toMatchObject({ effect: 'write', runtimeApply: 'separate' });
    expect(getMcpActionPolicy('db_get_analytics_v2')).toMatchObject({ effect: 'read', section: 'analytics' });
    expect(getMcpActionPolicy('save_project')).toMatchObject({ effect: 'file' });
  });
  it('не угадывает свойства неизвестного действия', () => {
    expect(getMcpActionPolicy('db_get_invented')).toMatchObject({ effect: 'unknown', section: 'unclassified' });
    expect(getMcpActionPolicy('new_action', { botcraft: { section: 'users', effect: 'read' } }))
      .toMatchObject({ effect: 'read', section: 'users' });
  });
});
