/**
 * @fileoverview Пропуск защищённой страницы админки в Vite только после серверной проверки.
 */
import http from 'node:http';
import https from 'node:https';
import type { IncomingMessage, ServerResponse } from 'node:http';

/** Перенаправляет запрос ровно один раз и сохраняет все cookie и редиректы сервера. */
export function proxyAdminToVite(target: string) {
  return (req: IncomingMessage, res: ServerResponse | undefined): Promise<string | undefined> => {
    if (!res) return Promise.resolve(undefined);
    return new Promise((resolve) => {
      const url = new URL(target);
      const request = (url.protocol === 'https:' ? https : http).request({
        protocol: url.protocol, hostname: url.hostname, port: url.port,
        method: req.method, path: req.url, headers: req.headers,
      });
      /** Ошибка прокси не должна превращаться в доступ к странице администрирования. */
      const fail = () => {
        if (!res.headersSent) res.writeHead(502, { 'Cache-Control': 'no-store' });
        res.end();
        resolve(req.url);
      };
      request.setTimeout(30000, () => request.destroy(new Error('Истекло ожидание backend')));
      request.on('error', fail);
      req.on('aborted', () => request.destroy());
      request.on('response', (upstream) => {
        if (upstream.statusCode === 204 && upstream.headers['x-botcraft-client-page'] === '1') {
          /** Сохраняем обновление сессии до передачи HTML обработчикам Vite. */
          if (upstream.headers['set-cookie']) res.setHeader('set-cookie', upstream.headers['set-cookie']);
          res.setHeader('Cache-Control', 'no-store');
          upstream.resume();
          resolve(req.url);
          return;
        }
        res.writeHead(upstream.statusCode || 502, upstream.headers);
        upstream.on('error', fail);
        upstream.pipe(res);
        res.on('finish', () => resolve(req.url));
        res.on('close', () => { upstream.destroy(); resolve(req.url); });
      });
      req.pipe(request);
    });
  };
}
