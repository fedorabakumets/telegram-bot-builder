/**
 * @fileoverview Request-scoped контекст токена агента для remote MCP
 * @description AsyncLocalStorage хранит Bearer PAT на время обработки HTTP-запроса MCP,
 * чтобы apiFetch не брал чужой process.env.MCP_AGENT_TOKEN в multi-tenant режиме.
 * @module lib/bot-tools/mcp-request-context
 */

import { AsyncLocalStorage } from 'node:async_hooks';

/** Контекст одного MCP HTTP-запроса */
export interface McpRequestContext {
  /** Сырой Bearer-токен агента (mcp_…) */
  token: string;
}

/** Хранилище контекста на цепочку async-вызовов */
const mcpRequestStorage = new AsyncLocalStorage<McpRequestContext>();

/**
 * Выполняет функцию в контексте токена агента (для HTTP MCP).
 * @param token - Сырой Bearer PAT
 * @param fn - Функция обработки запроса
 * @returns Результат fn
 */
export function runWithMcpToken<T>(token: string, fn: () => T): T {
  return mcpRequestStorage.run({ token }, fn);
}

/**
 * Возвращает токен агента из текущего ALS-контекста, если он есть.
 * @returns Сырой токен или undefined вне HTTP MCP-запроса
 */
export function getMcpToken(): string | undefined {
  return mcpRequestStorage.getStore()?.token;
}
