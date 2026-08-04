/**
 * @fileoverview Stateless обработчик Streamable HTTP для /mcp
 * @module server/routes/mcp/handleMcpHttpRequest
 */

import type { Request, Response } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { runWithMcpToken } from '../../../lib/bot-tools/mcp-request-context';
import { createBotcraftMcpServer } from '../../../lib/bot-tools/mcp-register-tools';

/**
 * Обрабатывает POST /mcp в stateless-режиме (новый server+transport на запрос).
 * Токен агента прокидывается в ALS для apiFetch.
 * @param req - Express request (с mcpAgentToken)
 * @param res - Express response
 */
export async function handleMcpHttpRequest(req: Request, res: Response): Promise<void> {
  const token = req.mcpAgentToken;
  if (!token) {
    res.status(401).json({ error: 'UNAUTHORIZED' });
    return;
  }

  await runWithMcpToken(token, async () => {
    const server = createBotcraftMcpServer({ enableFileTools: false });
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } finally {
      const cleanup = () => {
        void transport.close();
        void server.close();
      };
      if (res.writableEnded) {
        cleanup();
      } else {
        res.on('close', cleanup);
      }
    }
  });
}
