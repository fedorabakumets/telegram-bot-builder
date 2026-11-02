/** @fileoverview Проверка сессии и области каждого терминального соединения. */
import type { IncomingMessage } from 'http';
import type { Session, SessionData } from 'express-session';
import { WebSocket } from 'ws';
import { storage } from '../storages/storage';
/** Запрос с загруженной сессией. */
export type TerminalRequest = IncomingMessage & { /** Сессия пользователя. */ session?: Session & Partial<SessionData> };
/** Авторизованная область соединения. */
interface TerminalScope {
  /** Исходный запрос с возможностью перечитать сессию. */ request: TerminalRequest;
  /** Личность при подключении. */ userId: number;
  /** Проект либо общая подписка. */ projectId: number;
  /** Бот либо все боты. */ tokenId: number;
}
/** Контексты не переживают уничтожение соединений. */
const scopes = new WeakMap<WebSocket, TerminalScope>();
/** Отклоняет неполные, дробные и отрицательные идентификаторы. */
export function terminalScopeIds(url: string): { projectId: number; tokenId: number } | null {
  const params = new URLSearchParams(url.split('?')[1]);
  const project = params.get('projectId'), token = params.get('tokenId');
  if (!project || !token || !/^\d+$/.test(project) || !/^\d+$/.test(token)) return null;
  const projectId = Number(project), tokenId = Number(token);
  if (!Number.isSafeInteger(projectId) || !Number.isSafeInteger(tokenId) || (!projectId && tokenId)) return null;
  return { projectId, tokenId };
}
/** Проверяет проект и принадлежность бота без доверия клиентским идентификаторам. */
async function scopeAllowed(scope: TerminalScope, projectId: number, tokenId: number): Promise<boolean> {
  if (!(await storage.hasProjectAccess(projectId, scope.userId))) return false;
  if (!tokenId) return true;
  const token = await storage.getBotToken(tokenId);
  return token?.projectId === projectId;
}
/** Авторизует подписку до регистрации и отправки истории. */
export async function authorizeTerminal(ws: WebSocket, request: TerminalRequest): Promise<TerminalScope | null> {
  const ids = terminalScopeIds(request.url ?? '');
  const userId = request.session?.telegramUser?.id;
  if (!ids || !userId || !Number.isSafeInteger(userId)) return null;
  if (request.headers.origin && new URL(request.headers.origin).host !== request.headers.host) return null;
  const scope = { ...ids, request, userId };
  if (ids.projectId && !(await scopeAllowed(scope, ids.projectId, ids.tokenId))) return null;
  scopes.set(ws, scope);
  return scope;
}
/** Перечитывает сессию, включая удаление сессии и отзыв проектного доступа. */
export async function terminalCanReceive(ws: WebSocket, projectId = 0, tokenId = 0): Promise<boolean> {
  const scope = scopes.get(ws);
  if (!scope || ws.readyState !== WebSocket.OPEN) return false;
  try {
    await new Promise<void>((resolve, reject) => {
      const session = scope.request.session;
      if (!session) { reject(new Error('Нет сессии')); return; }
      session.reload(error => error ? reject(error) : resolve());
    });
    if (scope.request.session?.telegramUser?.id !== scope.userId) throw new Error('Сессия изменена');
    if (scope.projectId && !(await scopeAllowed(scope, scope.projectId, scope.tokenId))) throw new Error('Доступ отозван');
    if (!projectId) return true;
    if (scope.projectId && (scope.projectId !== projectId || (scope.tokenId && tokenId && scope.tokenId !== tokenId))) return false;
    return await scopeAllowed(scope, projectId, tokenId);
  } catch {
    ws.close(4003, 'Авторизация или доступ изменились');
    return false;
  }
}
/** Отправляет данные только после актуальной проверки прав. */
export async function sendAuthorizedTerminal(ws: WebSocket, payload: string, projectId = 0, tokenId = 0): Promise<void> {
  if (await terminalCanReceive(ws, projectId, tokenId)) {
    if (ws.readyState === WebSocket.OPEN) ws.send(payload);
  }
}
