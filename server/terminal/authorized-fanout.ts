/** @fileoverview Единая безопасная доставка событий и логов локальным подписчикам. */
import { activeConnections } from './activeConnections';
import { sendAuthorizedTerminal } from './terminal-access';
/** Доставляет сообщение только подпискам с актуальной сессией и правами. */
export async function authorizedFanout(payload: string, projectId = 0, tokenId = 0): Promise<void> {
  const sockets = new Set([...activeConnections.entries()].filter(([key]) =>
    !projectId || key.startsWith('user_') || key.startsWith(`${projectId}_`),
  ).flatMap(([, connections]) => [...connections]));
  await Promise.all([...sockets].map(ws => sendAuthorizedTerminal(ws, payload, projectId, tokenId)));
}
