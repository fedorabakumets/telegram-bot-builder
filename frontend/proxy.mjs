/** @fileoverview Потоковый HTTP и WebSocket прокси к единственному настроенному backend. */
import http from 'node:http';
import https from 'node:https';
/** Исключает служебные заголовки транспорта, сохраняя cookies и исходный адрес клиента. */
function requestHeaders(req, websocket) {
  const headers = { ...req.headers };
  if (!websocket) {
    for (const key of String(headers.connection || '').split(',')) delete headers[key.trim().toLowerCase()];
    for (const key of ['connection', 'upgrade', 'proxy-authorization', 'proxy-connection', 'keep-alive', 'te', 'trailer', 'transfer-encoding']) delete headers[key];
  }
  headers['x-forwarded-host'] = req.headers.host;
  headers['x-forwarded-proto'] = req.headers['x-forwarded-proto'] === 'https' || req.socket.encrypted ? 'https' : 'http';
  headers['x-forwarded-for'] = req.socket.remoteAddress;
  return headers;
}
/** Создаёт запрос к фиксированному адресу, не принимая адрес назначения от клиента. */
export function proxyRequest(req, backend, websocket = false) {
  const transport = backend.protocol === 'https:' ? https : http;
  const request = transport.request({ protocol: backend.protocol, hostname: backend.hostname.replace(/^\[|\]$/g, ''), port: backend.port,
    method: req.method, path: req.url, headers: requestHeaders(req, websocket) });
  const deadline = setTimeout(() => request.destroy(new Error('Истекло ожидание ответа backend')), 120000);
  deadline.unref();
  /** Продлевает ожидание заголовков, пока клиент активно загружает большой файл. */
  const refresh = () => deadline.refresh();
  req.on('data', refresh);
  for (const event of ['response', 'upgrade', 'error', 'close']) request.once(event, () => { clearTimeout(deadline); req.off('data', refresh); });
  return request;
}
/** Передаёт ответ без накопления тела в оперативной памяти. */
export function proxyHttp(req, res, backend, onClientPage) {
  const upstream = proxyRequest(req, backend);
  upstream.on('response', (reply) => {
    reply.on('error', () => res.destroy());
    reply.on('aborted', () => res.destroy());
    if (reply.statusCode === 204 && reply.headers['x-botcraft-client-page'] === '1') {
      res.setHeader('Cache-Control', 'no-store');
      if (reply.headers['set-cookie']) res.setHeader('Set-Cookie', reply.headers['set-cookie']);
      reply.resume();
      void onClientPage().catch(() => res.destroy());
      return;
    }
    const headers = { ...reply.headers };
    for (const key of String(headers.connection || '').split(',')) delete headers[key.trim().toLowerCase()];
    for (const key of ['connection', 'keep-alive', 'transfer-encoding', 'upgrade', 'te', 'trailer']) delete headers[key];
    delete headers['x-botcraft-client-page'];
    if (headers.location?.startsWith(backend.origin + '/')) headers.location = headers.location.slice(backend.origin.length);
    res.writeHead(reply.statusCode || 502, headers);
    reply.pipe(res);
  });
  upstream.on('error', () => { if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' }).end('Сервер временно недоступен'); else res.destroy(); });
  req.on('aborted', () => upstream.destroy());
  res.on('close', () => upstream.destroy());
  req.pipe(upstream);
}
/** Проксирует двунаправленный WebSocket с исходными cookie и протоколами. */
export function proxyUpgrade(req, socket, head, backend) {
  const upstream = proxyRequest(req, backend, true);
  upstream.on('upgrade', (reply, remote, remoteHead) => {
    socket.write(`HTTP/1.1 ${reply.statusCode} ${reply.statusMessage}\r\n`);
    for (let i = 0; i < reply.rawHeaders.length; i += 2) socket.write(`${reply.rawHeaders[i]}: ${reply.rawHeaders[i + 1]}\r\n`);
    socket.write('\r\n');
    if (remoteHead.length) socket.write(remoteHead);
    if (head.length) remote.write(head);
    socket.on('error', () => remote.destroy()); remote.on('error', () => socket.destroy());
    socket.on('close', () => remote.destroy()); remote.on('close', () => socket.destroy());
    remote.pipe(socket).pipe(remote);
  });
  upstream.on('response', (reply) => { socket.end(`HTTP/1.1 ${reply.statusCode || 502} Rejected\r\nConnection: close\r\n\r\n`); reply.resume(); });
  upstream.on('error', () => socket.destroy());
  socket.on('error', () => upstream.destroy());
  socket.on('close', () => upstream.destroy());
  upstream.end();
}
