/**
 * @fileoverview Тесты сборки сниппетов MCP-конфига для вкладки «Агент»
 * @module editor/agent/buildMcpConfigSnippets.test
 */

import { describe, expect, it } from 'vitest';
import {
  buildCodexToml,
  buildRemoteConfig,
  buildStdioConfig,
} from './buildMcpConfigSnippets';

describe('buildMcpConfigSnippets', () => {
  const token = 'mcp_testtoken123';

  it('remote URL содержит /mcp и Bearer', () => {
    const json = JSON.parse(buildRemoteConfig(token));
    const cfg = json.mcpServers['botcraft-builder'];
    expect(cfg.url).toMatch(/\/mcp$/);
    expect(cfg.headers.Authorization).toBe(`Bearer ${token}`);
    expect(cfg.command).toBeUndefined();
  });

  it('stdio содержит command и MCP_AGENT_TOKEN', () => {
    const json = JSON.parse(buildStdioConfig(token));
    const cfg = json.mcpServers['botcraft-builder'];
    expect(cfg.command).toBe('npm');
    expect(cfg.env.MCP_AGENT_TOKEN).toBe(token);
  });

  it('codex TOML содержит url /mcp и bearer_token_env_var', () => {
    const toml = buildCodexToml(token);
    expect(toml).toContain('[mcp_servers.botcraft-builder]');
    expect(toml).toContain('/mcp');
    expect(toml).toContain('bearer_token_env_var');
  });
});
