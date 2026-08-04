/**
 * @fileoverview Тесты rate limit и флага MCP_HTTP_ENABLED
 * @module server/routes/mcp/mcp-http-unit.test
 */

import { afterEach, describe, expect, it } from 'vitest';
import { isMcpHttpEnabled } from './isMcpHttpEnabled';
import { consumeMcpRateLimit, resetMcpRateLimitBuckets } from './mcpRateLimit';

describe('isMcpHttpEnabled', () => {
  afterEach(() => {
    delete process.env.MCP_HTTP_ENABLED;
  });

  it('по умолчанию включён', () => {
    delete process.env.MCP_HTTP_ENABLED;
    expect(isMcpHttpEnabled()).toBe(true);
  });

  it('выключается через false/0/off', () => {
    process.env.MCP_HTTP_ENABLED = 'false';
    expect(isMcpHttpEnabled()).toBe(false);
    process.env.MCP_HTTP_ENABLED = '0';
    expect(isMcpHttpEnabled()).toBe(false);
    process.env.MCP_HTTP_ENABLED = 'off';
    expect(isMcpHttpEnabled()).toBe(false);
  });
});

describe('consumeMcpRateLimit', () => {
  afterEach(() => {
    resetMcpRateLimitBuckets();
  });

  it('пропускает до max и затем отклоняет', () => {
    const key = 'test:limit';
    expect(consumeMcpRateLimit(key, { max: 2, windowMs: 60_000 })).toBe(true);
    expect(consumeMcpRateLimit(key, { max: 2, windowMs: 60_000 })).toBe(true);
    expect(consumeMcpRateLimit(key, { max: 2, windowMs: 60_000 })).toBe(false);
  });
});
