/** @fileoverview Загрузка истории последнего запуска с проверкой действующей сессии. */
import type { WebSocket } from 'ws';
import { storage } from '../storages/storage';
import { sendAuthorizedTerminal } from './terminal-access';
import { redactSecrets } from '../utils/redactSecrets';
/** Передаёт историю только авторизованному получателю. */
export async function sendTerminalHistory(ws: WebSocket, projectId: number, tokenId: number): Promise<void> {
  const logs = await storage.getLatestLaunchLogs(projectId, tokenId, 500);
  for (const log of logs) {
    await sendAuthorizedTerminal(ws, JSON.stringify({
      type: log.type ?? 'stdout', content: redactSecrets(log.content), projectId, tokenId,
      timestamp: log.timestamp?.toISOString() ?? new Date().toISOString(), logId: log.id,
    }), projectId, tokenId);
  }
}
