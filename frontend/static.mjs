/** @fileoverview Безопасная потоковая раздача клиентской сборки без серверных файлов. */
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
/** Типы файлов клиентской сборки. */
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
/** Проверяет существование обычного файла. */
async function fileExists(file) { return stat(file).then((s) => s.isFile()).catch(() => false); }
/** Отдаёт статический файл либо клиентскую страницу для браузерной навигации. */
export async function serveStatic(req, res, root, forcePage = false, onMissingAsset) {
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405).end(); return; }
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://frontend').pathname); }
  catch { res.writeHead(400).end(); return; }
  const parts = pathname.split(/[\\/]/);
  if (parts.some((p) => p === '..' || p.startsWith('.')) || parts.includes('server') || pathname.includes('\0')) {
    res.writeHead(404).end(); return;
  }
  let file = path.resolve(root, `.${pathname}`);
  if (!file.startsWith(`${path.resolve(root)}${path.sep}`)) file = '';
  if (forcePage) file = path.join(root, 'index.html');
  else if (!file || !(await fileExists(file))) {
    if (pathname.startsWith('/assets/') && onMissingAsset) { onMissingAsset(); return; }
    if (!req.headers.accept?.includes('text/html') || path.extname(pathname)) { res.writeHead(404).end(); return; }
    file = path.join(root, 'index.html');
  }
  if (!(await fileExists(file))) { res.writeHead(404).end(); return; }
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (!res.hasHeader('Cache-Control')) res.setHeader('Cache-Control', path.extname(file) === '.html' ? 'no-cache' : 'public, max-age=3600');
  res.writeHead(200);
  if (req.method === 'HEAD') { res.end(); return; }
  const stream = createReadStream(file);
  stream.on('error', () => res.destroy());
  res.on('close', () => stream.destroy());
  stream.pipe(res);
}
