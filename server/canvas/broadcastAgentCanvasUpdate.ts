/**
 * @fileoverview Broadcast программной правки сценария от ИИ-агента на открытый холст
 * @description Вызывается после успешной записи проекта в БД (MCP live-редактирование):
 * формирует canvas-sync с actor.kind='agent' и рассылает в комнату canvas_<projectId>.
 * @module server/canvas/broadcastAgentCanvasUpdate
 */

import type { BotDataWithSheets } from '@shared/schema';
import { buildAgentCanvasActor } from '../../shared/canvas-sync/canvas-actor';
import type { CanvasSyncMessage } from '../../shared/canvas-sync/canvas-sync-message';
import { broadcastCanvasSync } from './broadcastCanvasSync';

/**
 * Вещает снапшот сценария от ИИ-агента всем клиентам комнаты проекта.
 * Сообщение содержит actor.kind='agent', tabId и timestamp — без них клиентский
 * guard isCanvasSyncMessage отбросит сообщение.
 * @param projectId - ID проекта
 * @param data - Актуальные данные проекта (снапшот BotDataWithSheets)
 * @param agent - Параметры сессии агента (sessionId, displayName)
 */
export function broadcastAgentCanvasUpdate(
  projectId: number,
  data: BotDataWithSheets,
  agent?: { sessionId?: string; displayName?: string },
): void {
  const actor = buildAgentCanvasActor({
    sessionId: agent?.sessionId ?? 'mcp',
    displayName: agent?.displayName ?? 'ИИ-агент',
  });

  const message: CanvasSyncMessage = {
    type: 'canvas-sync',
    projectId,
    tabId: `mcp-${actor.sessionId}`,
    actor,
    userId: actor.userId,
    timestamp: Date.now(),
    data,
  };

  broadcastCanvasSync(projectId, message);
}
