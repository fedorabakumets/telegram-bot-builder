/**
 * @fileoverview Настройки отдельного Vite-интерфейса без публикации серверных переменных.
 */
import type { ServerOptions } from 'vite';
import { proxyAdminToVite } from './vite-admin-proxy';
import { backendRoutePatterns } from '../frontend/routes.mjs';

/** Создаёт прокси только для маршрутов сервера; адрес остаётся внутри Node.js. */
export function createSplitViteServer(env: Record<string, string | undefined>): ServerOptions {
  const target = env.BACKEND_URL || `http://127.0.0.1:${env.BACKEND_PORT || '5000'}`;
  const url = new URL(target);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('BACKEND_URL должен быть HTTP(S)-адресом без учётных данных');
  }
  const port = Number(env.FRONTEND_PORT || '5173');
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Некорректный FRONTEND_PORT');
  return {
    port, host: env.FRONTEND_HOST || '127.0.0.1', strictPort: true,
    hmr: { overlay: true },
    proxy: Object.fromEntries(backendRoutePatterns.map((pattern: string) => [
      pattern, { target, ws: true, changeOrigin: false, ...(pattern.startsWith('^/admin(') ? { bypass: proxyAdminToVite(target) } : {}) },
    ])),
  };
}
