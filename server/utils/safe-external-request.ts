/**
 * @fileoverview Защищённый HTTP-запрос с проверкой DNS и каждого перенаправления.
 */
import http from 'node:http';
import https from 'node:https';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import ipaddr from 'ipaddr.js';
import { validateExternalUrl } from './validateExternalUrl';

/** Проверяет, является ли адрес глобальным одноадресным IP.
 * @param address - Проверяемый адрес
 * @returns Признак разрешённого адреса
 */
export function isPublicAddress(address: string): boolean {
  try {
    let ip = ipaddr.parse(address);
    if (ip.kind() === 'ipv6' && (ip as ipaddr.IPv6).isIPv4MappedAddress()) ip = (ip as ipaddr.IPv6).toIPv4Address();
    return ip.range() === 'unicast';
  } catch { return false; }
}

/** Выполняет запрос только к проверенному адресу, повторяя проверку при redirect.
 * @param source - Исходный URL
 * @param method - Метод запроса
 * @param redirects - Число пройденных перенаправлений
 * @returns Ответ сервера и конечный URL
 */
export async function safeExternalRequest(source: string, method: 'HEAD' | 'GET', redirects = 0): Promise<{ response: http.IncomingMessage; url: URL }> {
  if (redirects > 5) throw new Error('Слишком много перенаправлений');
  const valid = validateExternalUrl(source);
  if (!valid.valid) throw new Error(valid.reason);
  const url = new URL(source);
  if (url.username || url.password) throw new Error('Учётные данные в URL запрещены');
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  const records = isIP(hostname) ? [{ address: hostname, family: isIP(hostname) }] : await lookup(hostname, { all: true, verbatim: true });
  if (!records.length || records.some(record => !isPublicAddress(record.address))) throw new Error('Внутренние адреса недоступны');
  const chosen = records[0];
  const response = await new Promise<http.IncomingMessage>((resolve, reject) => {
    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(url, { method, timeout: 30000, family: chosen.family, lookup: (_host, _options, cb) => cb(null, chosen.address, chosen.family as 4 | 6) }, resolve);
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('Превышено время ожидания')));
    req.end();
  });
  if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
    response.resume();
    return safeExternalRequest(new URL(response.headers.location, url).toString(), method, redirects + 1);
  }
  return { response, url };
}
