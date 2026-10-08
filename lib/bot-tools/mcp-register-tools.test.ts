/**
 * @fileoverview Тесты регистрации MCP-тулов (file tools только на stdio)
 * @module lib/bot-tools/mcp-register-tools.test
 */

import { describe, expect, it, vi } from 'vitest';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerMcpTools } from './mcp-register-tools.ts';

/**
 * Собирает имена зарегистрированных тулов через шпион registerTool
 * @param enableFileTools - Флаг файловых тулов
 * @returns Список имён
 */
function collectToolNames(enableFileTools: boolean): string[] {
  const names: string[] = [];
  const fake = {
    registerTool: vi.fn((name: string) => {
      names.push(name);
    }),
  };
  registerMcpTools(fake as unknown as McpServer, { enableFileTools });
  return names;
}

describe('registerMcpTools', () => {
  /** Четыре шага управления аккаунтом доступны в обоих транспортах */
  it.each([false, true])('регистрирует юзербот на транспорте с файловыми инструментами=%s', (fileTools) => {
    expect(collectToolNames(fileTools)).toEqual(expect.arrayContaining([
      'db_set_userbot_settings', 'db_userbot_send_code',
      'db_userbot_sign_in', 'db_userbot_sign_in_2fa',
    ]));
  });
  it('на HTTP (enableFileTools=false) нет load_project/save_project', () => {
    const names = collectToolNames(false);
    expect(names).not.toContain('load_project');
    expect(names).not.toContain('save_project');
    expect(names).toContain('db_list_projects');
    expect(names).toContain('db_archive_project');
    expect(names).toContain('db_unarchive_project');
    expect(names).toContain('update_project_db');
    expect(names).toContain('db_add_bot_token');
    expect(names).toContain('db_update_bot_token');
    expect(names).toContain('db_delete_bot_token');
  });

  it('на stdio (enableFileTools=true) есть load_project/save_project', () => {
    const names = collectToolNames(true);
    expect(names).toContain('load_project');
    expect(names).toContain('save_project');
  });
});
