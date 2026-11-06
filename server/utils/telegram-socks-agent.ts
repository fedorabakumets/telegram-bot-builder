/**
 * @fileoverview Соединение запросов Telegram через SOCKS5.
 */
import { connect as connectTls } from 'node:tls';
import { SocksClient } from 'socks';
import { Agent } from 'undici';

/**
 * Создаёт агент с SOCKS5-туннелем и проверкой TLS-сертификата.
 * @param address - Адрес прокси с необязательными учётными данными
 * @returns Агент для запросов через прокси
 */
export function createTelegramSocksAgent(address: string): Agent {
  const proxy = new URL(address);
  return new Agent({ connect(options, callback) {
    SocksClient.createConnection({
      command: 'connect', timeout: 10000,
      proxy: {
        host: proxy.hostname.replace(/^\[|\]$/g, ''), port: Number(proxy.port || 1080), type: 5,
        userId: decodeURIComponent(proxy.username), password: decodeURIComponent(proxy.password),
      },
      destination: { host: options.hostname.replace(/^\[|\]$/g, ''), port: Number(options.port || (options.protocol === 'https:' ? 443 : 80)) },
    }).then(({ socket }) => {
      if (options.protocol !== 'https:') return callback(null, socket);
      const secure = connectTls({ socket, servername: options.servername || options.hostname });
      const onError = (error: Error) => callback(error, null);
      secure.once('error', onError);
      secure.once('secureConnect', () => { secure.removeListener('error', onError); callback(null, secure); });
    }, (error: Error) => callback(error, null));
  } });
}
