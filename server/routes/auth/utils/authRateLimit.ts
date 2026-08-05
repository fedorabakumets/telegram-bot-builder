/**
 * @fileoverview In-memory rate limiter для /api/auth/*
 * @module auth/utils/authRateLimit
 */

import type { Request, Response, NextFunction } from "express";

/** Параметры окна лимита */
export interface AuthRateLimitOptions {
  /** Максимум запросов в окне */
  max: number;
  /** Длина окна в миллисекундах */
  windowMs: number;
}

/** Значения по умолчанию: 5 запросов в минуту */
const DEFAULT_OPTS: AuthRateLimitOptions = { max: 5, windowMs: 60_000 };

/** Счётчики по ключу IP */
const buckets = new Map<string, { count: number; resetAt: number }>();

/**
 * Потребляет один слот rate limit для ключа
 *
 * @param key - Ключ (обычно IP)
 * @param opts - Параметры окна
 * @returns true если запрос разрешён, false если лимит исчерпан
 */
export function consumeAuthRateLimit(
  key: string,
  opts: AuthRateLimitOptions = DEFAULT_OPTS,
): boolean {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || now >= entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return true;
  }

  if (entry.count >= opts.max) {
    return false;
  }

  entry.count += 1;
  return true;
}

/**
 * Сбрасывает все бакеты (для тестов)
 */
export function resetAuthRateLimitBuckets(): void {
  buckets.clear();
}

/**
 * Express middleware rate limit для auth-роутов
 *
 * @param req - Запрос
 * @param res - Ответ
 * @param next - Следующий middleware
 */
export function authRateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const key = req.ip || req.socket.remoteAddress || "unknown";
  if (!consumeAuthRateLimit(key)) {
    res.status(429).json({
      success: false,
      error: "Слишком много запросов к auth. Повторите позже.",
    });
    return;
  }
  next();
}
