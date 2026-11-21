/** @fileoverview Проверка и разрешение только публичных адресов пользовательских прокси. */
import { lookup } from 'node:dns/promises';
import { BlockList, isIP } from 'node:net';
import type { ProjectTelegramAccountProxyInput } from '@shared/project-telegram-accounts';
import { ProjectTelegramInputError, telegramInput } from './input';

const blocked = new BlockList();
for (const [address, bits] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
  ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24],
  ['192.88.99.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24],
  ['203.0.113.0', 24], ['224.0.0.0', 3],
] as const) blocked.addSubnet(address, bits, 'ipv4');
for (const [address, bits] of [['2001::', 23], ['2001:db8::', 32], ['2002::', 16], ['3fff::', 20]] as const) {
  blocked.addSubnet(address, bits, 'ipv6');
}
const globalV6 = new BlockList();
globalV6.addSubnet('2000::', 3, 'ipv6');

/**
 * Проверяет адрес для исходящего соединения прокси.
 * @param address - Адрес из токена настроек или ответа DNS.
 * @returns Доступность публичного адреса.
 */
function isPublicAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return !blocked.check(address, 'ipv4');
  return family === 6 && globalV6.check(address, 'ipv6') && !blocked.check(address, 'ipv6');
}

/**
 * Проверяет форму настроек без выполнения сетевых запросов.
 * @param raw - Параметры из запроса или null для отключения прокси.
 * @returns Проверенные параметры либо null.
 */
export function normalizeProjectTelegramProxy(raw: unknown): ProjectTelegramAccountProxyInput | null {
  if (raw === null) return null;
  const { type, host: suppliedHost, port, username, password } = telegramInput(raw);
  const host = typeof suppliedHost === 'string' ? suppliedHost.trim().toLowerCase().replace(/^\[([^\]]+)\]$/, '$1') : '';
  const labels = host.split('.');
  const validDomain = host.length <= 253 && labels.length > 1 && /[a-z]/.test(labels.at(-1) ?? '')
    && labels.every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label));
  if (host.includes('%') || (!isIP(host) && !validDomain) || (isIP(host) && !isPublicAddress(host))) {
    throw new ProjectTelegramInputError('Укажите публичный адрес прокси без схемы.');
  }
  if ((type !== 'http' && type !== 'socks5') || typeof port !== 'number' || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new ProjectTelegramInputError('Выберите тип прокси и порт от 1 до 65535.');
  }
  if ((username !== undefined && (typeof username !== 'string' || Buffer.byteLength(username) > 255 || /[\r\n\x00]/.test(username))) ||
      (password !== undefined && (typeof password !== 'string' || Buffer.byteLength(password) > 255 || /[\r\n\x00]/.test(password)))) {
    throw new ProjectTelegramInputError('Некорректные учётные данные прокси.');
  }
  return { type, host, port, username: username as string | undefined, password: password as string | undefined };
}

/**
 * Фиксирует публичный адрес прокси до установления соединения.
 * @param proxy - Проверенные параметры прокси.
 * @returns Параметры с разрешённым публичным IP без повторного DNS-запроса.
 */
export async function resolveProjectTelegramProxy(proxy: ProjectTelegramAccountProxyInput): Promise<ProjectTelegramAccountProxyInput> {
  const checked = normalizeProjectTelegramProxy(proxy)!;
  if (isIP(checked.host)) return checked;
  const addresses = await lookup(checked.host, { all: true }).catch(() => []);
  if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) {
    throw new ProjectTelegramInputError('Не удалось разрешить публичный адрес прокси.');
  }
  return { ...checked, host: addresses[0].address };
}
