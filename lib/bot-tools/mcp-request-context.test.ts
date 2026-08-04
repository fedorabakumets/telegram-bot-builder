/**
 * @fileoverview Тесты request-scoped токена MCP и apiFetch
 * @module lib/bot-tools/mcp-request-context.test
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { getMcpToken, runWithMcpToken } from './mcp-request-context.ts';
import { apiFetch, resolveMcpAgentToken } from './api-fetch.ts';

describe('mcp-request-context / apiFetch', () => {
  afterEach(() => {
    delete process.env.MCP_AGENT_TOKEN;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('getMcpToken пуст вне ALS', () => {
    expect(getMcpToken()).toBeUndefined();
  });

  it('runWithMcpToken изолирует токены в параллельных вызовах', async () => {
    const seen: string[] = [];
    await Promise.all([
      runWithMcpToken('mcp_aaa', async () => {
        await new Promise((r) => setTimeout(r, 20));
        seen.push(getMcpToken()!);
      }),
      runWithMcpToken('mcp_bbb', async () => {
        await new Promise((r) => setTimeout(r, 5));
        seen.push(getMcpToken()!);
      }),
    ]);
    expect(seen.sort()).toEqual(['mcp_aaa', 'mcp_bbb']);
  });

  it('resolveMcpAgentToken предпочитает ALS над env', () => {
    process.env.MCP_AGENT_TOKEN = 'mcp_env';
    expect(resolveMcpAgentToken()).toBe('mcp_env');
    runWithMcpToken('mcp_als', () => {
      expect(resolveMcpAgentToken()).toBe('mcp_als');
    });
  });

  it('apiFetch ставит Authorization из ALS', async () => {
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await runWithMcpToken('mcp_req', async () => {
      await apiFetch('/api/projects', { apiBaseUrl: 'http://example.test' });
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get('Authorization')).toBe('Bearer mcp_req');
    expect(fetchMock.mock.calls[0]![0]).toBe('http://example.test/api/projects');
  });
});
