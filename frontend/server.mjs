/** @fileoverview Отдельный frontend: клиентская сборка и прокси без доступа к базе или токенам. */
import http from 'node:http';
import { isBackendPath } from './routes.mjs';
import { serveStatic } from './static.mjs';
import { proxyHttp, proxyUpgrade } from './proxy.mjs';
/** Создаёт сервер с фиксированным адресом backend. */
export function createFrontendServer({ backendUrl, distPath }) {
  const backend = new URL(backendUrl);
  if (!['http:', 'https:'].includes(backend.protocol) || backend.username || backend.password || backend.pathname !== '/' || backend.search || backend.hash) throw new Error('BACKEND_URL должен содержать только HTTP(S) origin');
  const server = http.createServer((req, res) => {
    let pathname;
    try { pathname = new URL(req.url, 'http://frontend').pathname; } catch { res.writeHead(400).end(); return; }
    if (pathname === '/frontend-health') { res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }).end('{"ok":true}'); return; }
    if (isBackendPath(pathname)) proxyHttp(req, res, backend, () => serveStatic(req, res, distPath, true));
    else void serveStatic(req, res, distPath, false, () => proxyHttp(req, res, backend, () => serveStatic(req, res, distPath, true))).catch(() => { if (!res.headersSent) res.writeHead(500).end(); else res.destroy(); });
  });
  server.on('upgrade', (req, socket, head) => {
    let pathname;
    try { pathname = new URL(req.url, 'http://frontend').pathname; } catch { socket.destroy(); return; }
    if (!isBackendPath(pathname)) { socket.destroy(); return; }
    proxyUpgrade(req, socket, head, backend);
  });
  return server;
}
