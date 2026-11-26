/** @fileoverview Структурная проверка сессий Telethon без подключения к Telegram. */
import { BlockList, isIP } from 'node:net';
import { ProjectTelegramInputError } from './input';

/** Опубликованные сети Telegram, допустимые для адреса центра обработки данных. */
const telegramAddresses = new BlockList();
for (const [address, bits] of [
  ['91.108.56.0', 22], ['91.108.4.0', 22], ['91.108.8.0', 22], ['91.108.16.0', 22],
  ['91.108.12.0', 22], ['149.154.160.0', 20], ['91.105.192.0', 23],
  ['91.108.20.0', 22], ['185.76.151.0', 24],
] as const) telegramAddresses.addSubnet(address, bits, 'ipv4');
for (const [address, bits] of [
  ['2001:b28:f23d::', 48], ['2001:b28:f23f::', 48], ['2001:67c:4e8::', 48],
  ['2001:b28:f23c::', 48], ['2a0a:f280::', 32],
] as const) telegramAddresses.addSubnet(address, bits, 'ipv6');

/**
 * Кодирует адрес IPv4 или IPv6 как байты для формата сессии.
 * @param address - Проверенный адрес Telegram.
 * @param family - Семейство адреса.
 * @returns Байты сетевого адреса.
 */
function addressBytes(address: string, family: 4 | 6): Buffer {
  if (family === 4) return Buffer.from(address.split('.').map(Number));
  const [head, tail = ''] = address.split('::');
  const left = head ? head.split(':') : [];
  const right = tail ? tail.split(':') : [];
  const out = Buffer.alloc(16);
  [...left, ...Array<string>(8 - left.length - right.length).fill('0'), ...right].forEach((group, index) => {
    out.writeUInt16BE(Number.parseInt(group, 16), index * 2);
  });
  return out;
}

/**
 * Создаёт строку Telethon из данных сессии после проверки назначения.
 * @param dc - Номер центра обработки данных.
 * @param host - Публичный IP-адрес Telegram.
 * @param port - Порт сервера Telegram.
 * @param key - Ключ авторизации из локального ввода.
 * @returns Проверенная строка сессии Telethon.
 */
export function encodeTelegramSession(dc: unknown, host: unknown, port: unknown, key: unknown): string {
  const address = typeof host === 'string' ? host : '';
  const family = isIP(address);
  if (typeof dc !== 'number' || !Number.isInteger(dc) || dc < 1 || dc > 5 ||
      (family !== 4 && family !== 6) || !telegramAddresses.check(address, family === 4 ? 'ipv4' : 'ipv6') ||
      port !== 443 || !(key instanceof Uint8Array) || key.length !== 256 || !key.some(byte => byte !== 0)) {
    throw new ProjectTelegramInputError('Сессия содержит неподдерживаемые данные подключения Telegram.');
  }
  const ip = addressBytes(address, family);
  const data = Buffer.alloc(3 + ip.length + key.length);
  data[0] = dc;
  ip.copy(data, 1);
  data.writeUInt16BE(port, 1 + ip.length);
  data.set(key, 3 + ip.length);
  return `1${data.toString('base64').replace(/\+/g, '-').replace(/\//g, '_')}`;
}

/**
 * Проверяет строку Telethon, включая версию и допустимый адрес подключения.
 * @param raw - Строка сессии из формы или процесса авторизации.
 * @returns Строка в нормализованном формате Telethon.
 */
export function validateTelegramStringSession(raw: unknown): string {
  const value = typeof raw === 'string' ? raw.trim() : '';
  const body = value.slice(1);
  if (!value.startsWith('1') || ![352, 368].includes(body.length) || !/^[A-Za-z0-9_-]+=?$/.test(body)) {
    throw new ProjectTelegramInputError('Укажите корректную строку сессии Telethon.');
  }
  const data = Buffer.from(body, 'base64url');
  const ipSize = data.length === 263 ? 4 : data.length === 275 ? 16 : 0;
  if (!ipSize) throw new ProjectTelegramInputError('Укажите корректную строку сессии Telethon.');
  const ip = data.subarray(1, 1 + ipSize);
  const host = ipSize === 4 ? [...ip].join('.') : Array.from({ length: 8 }, (_, index) => ip.readUInt16BE(index * 2).toString(16)).join(':');
  return encodeTelegramSession(data[0], host, data.readUInt16BE(1 + ipSize), data.subarray(3 + ipSize));
}
