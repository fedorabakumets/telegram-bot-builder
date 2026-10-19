/**
 * @fileoverview Реестр активных пользовательских сессий в Redis
 * @module auth/session-registry
 */

import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { getRedisPublisher } from '../redis/redisClient';
import type { TelegramUserDB } from '@shared/schema';

const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;
const SESSION_KEY_PREFIX = 'botcraft:active-session:';
const USER_SESSIONS_KEY_PREFIX = 'botcraft:user-sessions:';

/** Данные активной сессии, доступные клиентскому интерфейсу */
export interface ActiveSession {
  /** Публичный идентификатор сессии */
  id: string;
  /** Идентификатор браузерной сессии */
  sessionId: string;
  /** Идентификатор пользователя Telegram */
  userId: number;
  /** Отображаемое устройство и браузер */
  device: string;
  /** Тип устройства */
  kind: 'desktop' | 'mobile';
  /** IP-адрес последнего запроса сессии */
  ip?: string | null;
  /** Время создания сессии */
  createdAt: string;
  /** Время последней активности */
  lastActive: string;
  /** Признак текущей сессии */
  isCurrent?: boolean;
}

/** Возвращает ключ метаданных сессии */
function sessionKey(id: string): string { return `${SESSION_KEY_PREFIX}${id}`; }

/** Возвращает ключ множества сессий пользователя */
function userSessionsKey(userId: number): string { return `${USER_SESSIONS_KEY_PREFIX}${userId}`; }

/** Возвращает нормализованный IP-адрес запроса */
function resolveClientIp(req: Request): string | null {
  const ip = req.ip || req.socket.remoteAddress || null;
  return ip?.startsWith('::ffff:') ? ip.slice(7) : ip;
}

/** Определяет устройство по User-Agent */
function parseDevice(userAgent: string): Pick<ActiveSession, 'device' | 'kind'> {
  const mobile = /android|iphone|ipad|mobile/i.test(userAgent);
  const browser = /yabrowser/i.test(userAgent) ? 'Яндекс Браузер' : /vivaldi/i.test(userAgent) ? 'Vivaldi' : /brave/i.test(userAgent) ? 'Brave' : /edg|edgios/i.test(userAgent) ? 'Edge' : /opr\//i.test(userAgent) ? 'Opera' : /firefox|fxios/i.test(userAgent) ? 'Firefox' : /samsungbrowser/i.test(userAgent) ? 'Samsung Internet' : /crios/i.test(userAgent) ? 'Chrome' : /chrome/i.test(userAgent) ? 'Chrome' : /chromium/i.test(userAgent) ? 'Chromium' : /safari/i.test(userAgent) ? 'Safari' : 'Неизвестный браузер';
  const os = /windows/i.test(userAgent) ? 'Windows' : /mac os/i.test(userAgent) ? 'macOS' : /android/i.test(userAgent) ? 'Android' : /iphone|ipad/i.test(userAgent) ? 'iOS' : /linux/i.test(userAgent) ? 'Linux' : 'неизвестная ОС';
  return { device: `${browser} · ${os}`, kind: mobile ? 'mobile' : 'desktop' };
}

/** Регистрирует или обновляет сессию пользователя в Redis */
export async function registerSession(req: Request, user: TelegramUserDB): Promise<void> {
  const redis = getRedisPublisher();
  if (!redis || !req.session) return;
  const existing = await redis.get(`${SESSION_KEY_PREFIX}sid:${req.session.id}`);
  const publicId = existing || randomUUID();
  const previousRaw = existing ? await redis.get(sessionKey(publicId)) : null;
  const previous = previousRaw ? JSON.parse(previousRaw) as { createdAt?: string } : {};
  const now = new Date().toISOString();
  const device = parseDevice(String(req.headers['user-agent'] || ''));
  const metadata = {
    id: publicId, sessionId: req.session.id, userId: String(user.id),
    device: device.device, kind: device.kind, ip: resolveClientIp(req), createdAt: previous.createdAt || now, lastActive: now,
  };
  await redis.set(sessionKey(publicId), JSON.stringify(metadata), 'EX', SESSION_TTL_SECONDS);
  await redis.set(`${SESSION_KEY_PREFIX}sid:${req.session.id}`, publicId, 'EX', SESSION_TTL_SECONDS);
  await redis.sadd(userSessionsKey(user.id), publicId);
  await redis.expire(sessionKey(publicId), SESSION_TTL_SECONDS);
  await redis.expire(userSessionsKey(user.id), SESSION_TTL_SECONDS);
}

/** Обновляет время активности текущей сессии без блокировки запроса */
export function touchSession(req: Request): void {
  const userId = req.user?.id;
  if (!userId || !req.session) return;
  void registerSession(req, req.user!).catch(() => undefined);
}

/** Обновляет активность сессии после установки личности запроса */
export function sessionActivityMiddleware(req: Request, _res: Response, next: NextFunction): void {
  touchSession(req);
  next();
}

/** Возвращает список активных сессий пользователя */
export async function listSessions(userId: number, currentSessionId: string): Promise<ActiveSession[]> {
  const redis = getRedisPublisher();
  if (!redis) throw new Error('Redis недоступен');
  const ids = await redis.smembers(userSessionsKey(userId));
  const sessions: ActiveSession[] = [];
  for (const id of ids) {
    const raw = await redis.get(sessionKey(id));
    const data = raw ? JSON.parse(raw) as Record<string, string> : {};
    if (!data.id || Number(data.userId) !== userId) { await redis.srem(userSessionsKey(userId), id); continue; }
    sessions.push({ ...data, userId, kind: data.kind === 'mobile' ? 'mobile' : 'desktop', isCurrent: data.sessionId === currentSessionId } as ActiveSession);
  }
  return sessions
    .map((session) => ({ ...session, isCurrent: session.sessionId === currentSessionId }))
    .sort((a, b) => Date.parse(b.lastActive) - Date.parse(a.lastActive));
}

/** Удаляет текущую сессию из реестра Redis при выходе */
export async function removeSession(req: Request): Promise<void> {
  const redis = getRedisPublisher();
  if (!redis || !req.session?.telegramUser) return;
  const mappingKey = `${SESSION_KEY_PREFIX}sid:${req.session.id}`;
  const publicId = await redis.get(mappingKey);
  if (!publicId) return;
  await redis.del(`sess:${req.session.id}`, sessionKey(publicId), mappingKey);
  await redis.srem(userSessionsKey(req.session.telegramUser.id), publicId);
}

/** Завершает выбранную сессию пользователя */
export async function revokeSession(userId: number, publicId: string, currentSessionId: string): Promise<boolean> {
  const redis = getRedisPublisher();
  if (!redis) throw new Error('Redis недоступен');
  const raw = await redis.get(sessionKey(publicId));
  const data = raw ? JSON.parse(raw) as Record<string, string> : {};
  if (!data.id || Number(data.userId) !== userId || data.sessionId === currentSessionId) return false;
  await redis.del(`sess:${data.sessionId}`, sessionKey(publicId), `${SESSION_KEY_PREFIX}sid:${data.sessionId}`);
  await redis.srem(userSessionsKey(userId), publicId);
  return true;
}

/** Завершает выбранную сессию из защищённой админской зоны */
export async function revokeSessionByAdmin(userId: number, publicId: string): Promise<boolean> {
  const redis = getRedisPublisher();
  if (!redis) throw new Error('Redis недоступен');
  const raw = await redis.get(sessionKey(publicId));
  const data = raw ? JSON.parse(raw) as Record<string, string> : {};
  if (!data.id || Number(data.userId) !== userId || !data.sessionId) return false;
  await redis.del(`sess:${data.sessionId}`, sessionKey(publicId), `${SESSION_KEY_PREFIX}sid:${data.sessionId}`);
  await redis.srem(userSessionsKey(userId), publicId);
  return true;
}

/** Завершает все сессии выбранного пользователя из админской зоны */
export async function revokeAllSessionsByAdmin(userId: number): Promise<number> {
  const sessions = await listSessions(userId, '');
  let revoked = 0;
  for (const session of sessions) if (await revokeSessionByAdmin(userId, session.id)) revoked += 1;
  return revoked;
}

/** Завершает все сессии пользователя, кроме текущей */
export async function revokeOtherSessions(userId: number, currentSessionId: string): Promise<number> {
  const sessions = await listSessions(userId, currentSessionId);
  let revoked = 0;
  for (const session of sessions) if (!session.sessionId || session.sessionId !== currentSessionId) {
    if (await revokeSession(userId, session.id, currentSessionId)) revoked += 1;
  }
  return revoked;
}
