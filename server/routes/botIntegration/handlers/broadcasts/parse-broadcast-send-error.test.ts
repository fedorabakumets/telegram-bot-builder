/**
 * @fileoverview Проверка сохранения параметров ошибки Telegram для рассылки.
 */
import { describe, expect, it } from "vitest";
import { parseBroadcastSendError } from "./parse-broadcast-send-error";

describe("Ошибка отправки рассылки", () => {
  it("сохраняет retry_after из исключения Telegram 429", () => {
    const error = Object.assign(new Error("Too Many Requests"), {
      error_code: 429, parameters: { retry_after: 37 },
    });
    expect(parseBroadcastSendError(error)).toEqual({
      ok: false, errorCode: 429, retryAfter: 37, description: "Too Many Requests",
    });
  });
});
