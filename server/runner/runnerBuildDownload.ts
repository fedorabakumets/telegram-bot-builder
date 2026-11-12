/**
 * @fileoverview Потоковое HTTP-скачивание сборок без загрузки встроенного fetch.
 */
import { get as httpGet, type IncomingMessage } from "node:http";
import { get as httpsGet } from "node:https";

/**
 * Открывает поток ответа, ограничивая время и число перенаправлений.
 * @param url - Адрес сборки
 * @param signal - Общий сигнал таймаута загрузки
 * @param redirects - Оставшееся число перенаправлений
 * @returns Проверенный поток тела ответа
 */
export async function openBuildDownload(
  url: string, signal: AbortSignal, redirects = 5,
): Promise<IncomingMessage> {
  const address = new URL(url);
  if (!["http:", "https:"].includes(address.protocol)) throw new Error("Недопустимый протокол сборки");
  const response = await new Promise<IncomingMessage>((resolve, reject) => {
    const request = (address.protocol === "https:" ? httpsGet : httpGet)(address, { signal }, resolve);
    request.on("error", reject);
  });
  const status = response.statusCode ?? 0;
  if ([301, 302, 303, 307, 308].includes(status) && response.headers.location) {
    response.destroy();
    if (redirects <= 0) throw new Error("Слишком много перенаправлений сборки");
    return openBuildDownload(new URL(response.headers.location, address).href, signal, redirects - 1);
  }
  if (status < 200 || status >= 300) {
    response.destroy();
    throw new Error(`HTTP ${status} при скачивании сборки`);
  }
  return response;
}
