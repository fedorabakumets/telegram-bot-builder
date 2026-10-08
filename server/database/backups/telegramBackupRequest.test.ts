/**
 * @fileoverview Проверки загрузки дампов и безопасных ошибок Telegram без реальных запросов.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { fetch as undiciFetch } from "undici";
import { sendTelegramBackupDocument, TELEGRAM_BACKUP_MAX_BYTES } from "./telegramBackupRequest";

/** Реквизиты вымышленного бота и группы */
const config = { enabled: true, token: "123456:secret_test_token", chatId: "-12345" };

/**
 * Создаёт подменённый транспорт, возвращающий JSON.
 * @param body - Ответ Telegram
 * @param status - HTTP-статус
 * @returns HTTP-транспорт
 */
function reply(body: unknown, status = 200): typeof fetch {
  return async () => new Response(JSON.stringify(body), { status });
}

describe("отправка бэкапа в Telegram", () => {
  it("транспорт undici отправляет документ в настоящем multipart-запросе", async () => {
    let raw = "";
    const server = createServer(async (req, res) => {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(Buffer.from(chunk));
      raw = Buffer.concat(chunks).toString("utf8");
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: true, result: { message_id: 1 } }));
    });
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    try {
      const address = server.address() as { port: number };
      const request: typeof fetch = async (_url, init) =>
        await undiciFetch(`http://127.0.0.1:${address.port}`, init as any) as unknown as Response;
      await sendTelegramBackupDocument(config, Buffer.from("test-dump"), "panel.dump", "Бэкап panel", request);
      assert.match(raw, /name="document"; filename="panel.dump"/);
      assert.match(raw, /test-dump/);
      assert.match(raw, /name="chat_id"/);
      assert.match(raw, /-12345/);
    } finally { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
  });

  it("передаёт файл, Chat ID и подпись через multipart, ограничивает ожидание", async () => {
    const transport: typeof fetch = async (url, init) => {
      assert.equal(url, `https://api.telegram.org/bot${config.token}/sendDocument`);
      assert.equal(init?.method, "POST");
      assert.ok(init?.signal);
      const form = init?.body as FormData;
      assert.equal(form.get("chat_id"), config.chatId);
      assert.equal(form.get("caption"), "Бэкап panel");
      const file = form.get("document") as File;
      assert.equal(file.name, "panel.dump");
      assert.equal(await file.text(), "dump");
      return new Response(JSON.stringify({ ok: true, result: { message_id: 1 } }));
    };
    await sendTelegramBackupDocument(config, Buffer.from("dump"), "panel.dump", "Бэкап panel", transport);
  });

  it("не отправляет файл больше 50 МБ", async () => {
    let called = false;
    await assert.rejects(sendTelegramBackupDocument(config, Buffer.alloc(TELEGRAM_BACKUP_MAX_BYTES + 1), "x", "",
      async () => { called = true; return new Response(); }), /50 МБ/);
    assert.equal(called, false);
  });

  it("не раскрывает секреты из ответа, сети и некорректного JSON", async () => {
    const transports: Array<typeof fetch> = [
      reply({ ok: false, error_code: 403, description: config.token }),
      async () => { throw new Error(`Telegram: ${config.token}`); },
      async () => new Response(config.token),
      reply({ ok: true, token: config.token }),
      reply(null),
    ];
    for (const request of transports) {
      await assert.rejects(sendTelegramBackupDocument(config, Buffer.from("x"), "x", "", request),
        (error: Error) => !error.message.includes(config.token) && error.message.startsWith("Telegram:"));
    }
  });

  it("различает отказ токена, запрет чата, ограничение частоты и HTTP-ошибку", async () => {
    for (const [code, text] of [[401, "токен"], [403, "чат"], [429, "частоты"], [500, "отправить"]] as const) {
      await assert.rejects(sendTelegramBackupDocument(config, Buffer.from("x"), "x", "", reply({ ok: false }, code)),
        new RegExp(text));
    }
  });
});
