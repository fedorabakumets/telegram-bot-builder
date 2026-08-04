/**
 * @fileoverview Регистрация маршрутов remote HTTP MCP (/mcp)
 * @module server/routes/mcp/setupMcpRoutes
 */

import type { Express, Request, Response } from 'express';
import { isMcpHttpEnabled } from './isMcpHttpEnabled';
import { requireMcpBearer } from './requireMcpBearer';
import { handleMcpHttpRequest } from './handleMcpHttpRequest';

/**
 * Ответ 405 для методов без поддержки в stateless MCP.
 * @param _req - Request
 * @param res - Response
 */
function methodNotAllowed(_req: Request, res: Response): void {
  res.status(405).set('Allow', 'POST').json({ error: 'METHOD_NOT_ALLOWED' });
}

/**
 * Ответ 503 когда MCP_HTTP_ENABLED выключен.
 * @param _req - Request
 * @param res - Response
 */
function mcpDisabled(_req: Request, res: Response): void {
  res.status(503).json({ error: 'MCP_HTTP_DISABLED' });
}

/**
 * Подключает /mcp (Streamable HTTP, Bearer PAT, без файловых тулов).
 * @param app - Express application
 */
export function setupMcpRoutes(app: Express): void {
  if (!isMcpHttpEnabled()) {
    app.all('/mcp', mcpDisabled);
    return;
  }

  app.post('/mcp', requireMcpBearer, (req, res) => {
    void handleMcpHttpRequest(req, res).catch((err) => {
      console.error('[mcp] Ошибка обработки /mcp:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'MCP_INTERNAL_ERROR' });
      }
    });
  });
  app.get('/mcp', requireMcpBearer, methodNotAllowed);
  app.delete('/mcp', requireMcpBearer, methodNotAllowed);
}
