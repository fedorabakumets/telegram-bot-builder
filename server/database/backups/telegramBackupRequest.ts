/**
 * @fileoverview Отправка файлов бэкапа в Telegram без раскрытия токена в ошибках.
 */
import { Agent, FormData as TelegramFormData, fetch as undiciFetch } from "undici";
import { getProxyAgent } from "../../utils/telegram-proxy";
import { assertTelegramBackupConfig, type TelegramBackupConfig } from "./telegramBackupConfig";

/** Лимит загрузки документа в обычный Telegram Bot API */
export const TELEGRAM_BACKUP_MAX_BYTES = 50_000_000;
/** Агент прямого подключения, если прокси не настроен */
const directAgent = new Agent();

/**
 * Выполняет запрос с прокси панели без журналирования адреса с токеном.
 * @param url - Адрес метода Telegram
 * @param init - Тело и параметры запроса
 * @returns Ответ Telegram
 */
async function telegramFetch(url: string | URL | Request, init?: RequestInit): Promise<Response> {
  return await undiciFetch(String(url), { ...init, dispatcher: getProxyAgent() ?? directAgent } as any) as unknown as Response;
}

/**
 * Загружает документ, ограничивая время ожидания и размер файла.
 * @param config - Реквизиты отправителя и чата
 * @param bytes - Содержимое документа
 * @param filename - Имя файла
 * @param caption - Подпись с меткой базы и датой
 * @param request - HTTP-транспорт для тестов
 */
export async function sendTelegramBackupDocument(
  config: TelegramBackupConfig, bytes: Buffer, filename: string, caption: string,
  request: typeof fetch = telegramFetch,
): Promise<void> {
  assertTelegramBackupConfig(config);
  if (bytes.length > TELEGRAM_BACKUP_MAX_BYTES) throw new Error("Файл больше лимита Telegram 50 МБ; бэкап сохранён в хранилище");
  // Используем multipart того же транспорта: смешение версий FormData теряет документ
  const form = new TelegramFormData();
  form.set("chat_id", config.chatId);
  form.set("caption", caption);
  form.set("document", new Blob([new Uint8Array(bytes)], { type: "application/octet-stream" }), filename);
  let response: Response;
  let body: { ok?: boolean; error_code?: number; result?: { message_id?: number } };
  try {
    response = await request(`https://api.telegram.org/bot${config.token}/sendDocument`, {
      method: "POST", body: form as unknown as BodyInit, signal: AbortSignal.timeout(120_000),
    });
    body = await response.json() as typeof body;
  } catch {
    // Ответ сервера и ошибка сети могут содержать адрес с токеном
    throw new Error("Telegram: сервер недоступен или вернул некорректный ответ");
  }
  if (response.ok && body?.ok === true && typeof body.result?.message_id === "number") return;
  const code = body?.error_code ?? response.status;
  if (code === 401) throw new Error("Telegram: токен бота отклонён");
  if (code === 403) throw new Error("Telegram: бот не может отправлять файлы в этот чат");
  if (code === 429) throw new Error("Telegram: ограничение частоты отправки, повторите позже");
  throw new Error("Telegram: не удалось отправить файл, проверьте Chat ID и права бота");
}
