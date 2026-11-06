/** @fileoverview Проверка передачи адреса Telegram Bot API запускаемому боту. */

import { describe, expect, it, vi } from "vitest";
import { getTelegramApiBaseUrl } from "../utils/telegram-api-url";
import { withTelegramBotApiUrl } from "./telegramBotApiEnv";

vi.mock("../utils/telegram-api-url", () => ({ getTelegramApiBaseUrl: vi.fn() }));

describe("окружение Telegram Bot API", () => {
  it("передаёт локальный адрес вместо переменной бота", () => {
    vi.mocked(getTelegramApiBaseUrl).mockReturnValue("http://host.docker.internal:8081");
    expect(withTelegramBotApiUrl([{ key: "TELEGRAM_BOT_API_URL", value: "http://old" }, { key: "OTHER", value: "value" }]))
      .toEqual([{ key: "OTHER", value: "value" }, { key: "TELEGRAM_BOT_API_URL", value: "http://host.docker.internal:8081" }]);
  });

  it("убирает локальный адрес при выборе официального API", () => {
    vi.mocked(getTelegramApiBaseUrl).mockReturnValue("https://api.telegram.org");
    expect(withTelegramBotApiUrl([{ key: "TELEGRAM_BOT_API_URL", value: "http://old" }])).toEqual([]);
  });
});
