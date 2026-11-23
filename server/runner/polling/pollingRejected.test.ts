/** @fileoverview Проверки достоверной причины конфликтов polling и отсутствия секретов в диагностике. */
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { PollingRejected, pollingRejectionReason } from "./pollingRejected";
import { runPollingReceiver } from "./receiver";

/** Канонические ответы Telegram различают второго потребителя и активный webhook. */
const descriptions = {
  polling_conflict: "Conflict: terminated by other getUpdates request; make sure that only one bot instance is running",
  webhook_conflict: "Conflict: can't use getUpdates method while webhook is active; use deleteWebhook to delete the webhook first",
} as const;

describe("причины отказа polling", () => {
  for (const [reason, description] of Object.entries(descriptions)) {
    it(`сохраняет ${reason} до завершения приёмника и не повторяет запрос`, async () => {
      let calls = 0;
      const token = "12345:private-secret";
      const failure = await runPollingReceiver({ token, signal: new AbortController().signal,
        queue: { offset: async () => null, enqueue: async () => {} }, onUpdates: async () => {},
        request: async () => { calls++; return { status: 409, body: { ok: false, error_code: 409, description } }; },
        wait: async () => { throw new Error("Повтор после окончательного отказа запрещён"); },
      }).catch(error => error);
      expect(failure).toBeInstanceOf(PollingRejected);
      expect(failure).toMatchObject({ code: 409, reason, method: "getUpdates",
        tokenFingerprint: createHash("sha256").update(token).digest("hex") });
      expect(failure.message).not.toContain(description);
      expect(JSON.stringify(failure)).not.toContain(token);
      expect(calls).toBe(1);
    });
  }

  it("не доверяет тексту без точного структурированного ответа Telegram", () => {
    const description = descriptions.polling_conflict;
    for (const [status, body] of [
      [200, { ok: false, error_code: 409, description }],
      [409, { ok: true, error_code: 409, description }],
      [409, { ok: false, error_code: "409", description }],
      [409, { ok: false, error_code: 409, description: `${description} secret-token` }],
      [409, { ok: false, error_code: 409, description: "secret-token" }],
    ] as Array<[number, Record<string, unknown>]>) {
      expect(pollingRejectionReason(status, body)).toBe("telegram_rejected");
    }
  });

  it("не сохраняет произвольное описание в общей диагностике отказа", () => {
    const error = new PollingRejected("secret-token", 403);
    expect(error.message).toBe("Telegram отклонил polling: код 403");
    expect(JSON.stringify(error)).not.toContain("secret-token");
  });
});
