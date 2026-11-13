/** @fileoverview Ограниченный HTTP-транспорт Telegram без загрузки Undici. */
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";

/** Ответ Telegram без доверия к произвольным полям тела. */
export interface PollResponse {
  /** HTTP-код ответа. */
  status: number;
  /** Разобранное тело Telegram. */
  body: Record<string, unknown>;
}

/** Отправляет один long poll с ограничением времени и объёма ответа. */
export async function requestUpdates(token: string, payload: object, signal: AbortSignal,
  apiBase = "https://api.telegram.org", maxBytes = 8 * 1024 * 1024,
  method: "getUpdates" | "setWebhook" | "deleteWebhook" = "getUpdates"): Promise<PollResponse> {
  try {
    const address = new URL(`${apiBase.replace(/\/$/, "")}/bot${token}/${method}`);
    if (!["http:", "https:"].includes(address.protocol)) throw new Error("Недопустимый транспорт Telegram");
    const body = JSON.stringify(payload);
    return await new Promise<PollResponse>((resolve, reject) => {
      const request = (address.protocol === "https:" ? httpsRequest : httpRequest)(address, {
        method: "POST", signal: AbortSignal.any([signal, AbortSignal.timeout(35_000)]),
        headers: { "content-type": "application/json", "content-length": Buffer.byteLength(body) },
      }, async (response) => {
        try {
          const chunks: Buffer[] = [];
          let bytes = 0;
          for await (const chunk of response) {
            bytes += chunk.length;
            if (bytes > maxBytes) { response.destroy(); throw new Error("Слишком большой ответ Telegram"); }
            chunks.push(Buffer.from(chunk));
          }
          const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
          if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Некорректный ответ Telegram");
          resolve({ status: response.statusCode ?? 0, body: parsed });
        } catch { reject(new Error("Ошибка чтения ответа Telegram")); }
      });
      request.on("error", () => reject(new Error("Соединение Telegram прервано")));
      request.end(body);
    });
  } catch { throw new Error("Не удалось получить обновления Telegram"); }
}
