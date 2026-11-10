/**
 * @fileoverview Проверка запросов Telegram через SOCKS5-прокси.
 */
import { strict as assert } from 'node:assert';
import { createServer } from 'node:net';
import { test } from 'node:test';
import { fetch } from 'undici';
import { createTelegramSocksAgent } from './telegram-socks-agent';
import { validateTelegramProxy } from './telegram-connection';

test('запрос проходит через SOCKS5 и передаёт имя целевого сервера', async () => {
  let destination = '';
  const server = createServer((socket) => {
    let step = 0;
    /** Нормализует данные сокета для разбора байтов SOCKS5. */
    socket.on('data', (chunk) => {
      const data = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
      if (step++ === 0) socket.write(Buffer.from([5, 0]));
      else if (step === 2) {
        destination = data.subarray(5, 5 + data[4]).toString();
        socket.write(Buffer.from([5, 0, 0, 1, 127, 0, 0, 1, 0, 80]));
      } else socket.end('HTTP/1.1 200 OK\r\nContent-Length: 2\r\nConnection: close\r\n\r\nOK');
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const agent = createTelegramSocksAgent(`socks5://127.0.0.1:${address.port}`);
  try {
    const response = await fetch('http://example.test/', { dispatcher: agent });
    assert.equal(await response.text(), 'OK');
    assert.equal(destination, 'example.test');
    assert.equal(validateTelegramProxy('socks5://127.0.0.1:1080'), 'socks5://127.0.0.1:1080');
  } finally { await agent.close(); server.close(); }
});
