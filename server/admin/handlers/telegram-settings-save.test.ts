/**
 * @fileoverview Тесты saveTelegramSettings
 * @module server/admin/handlers/telegram-settings-save.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../services/app-settings.service", () => ({
  getSetting: vi.fn(),
  setSetting: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../services/telegram-bot-username", () => ({
  fetchBotUsernameFromToken: vi.fn(),
}));

import { getSetting, setSetting } from "../../services/app-settings.service";
import { fetchBotUsernameFromToken } from "../../services/telegram-bot-username";
import { saveTelegramSettings } from "./telegram-settings-save";

describe("saveTelegramSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("возвращает ошибку без clientId", async () => {
    const result = await saveTelegramSettings({ clientSecret: "s" });
    expect(result.success).toBe(false);
    expect(setSetting).not.toHaveBeenCalled();
  });

  it("сохраняет настройки и резолвит username из token", async () => {
    vi.mocked(getSetting).mockResolvedValue(undefined);
    vi.mocked(fetchBotUsernameFromToken).mockResolvedValue("mybot");

    const result = await saveTelegramSettings({
      clientId: "12345",
      clientSecret: "secret",
      botToken: "123:TOKEN",
    });

    expect(result.success).toBe(true);
    expect(result.botUsername).toBe("mybot");
    expect(setSetting).toHaveBeenCalledWith("telegram_client_id", "12345");
    expect(setSetting).toHaveBeenCalledWith("telegram_client_secret", "secret");
    expect(setSetting).toHaveBeenCalledWith("telegram_bot_token", "123:TOKEN");
    expect(setSetting).toHaveBeenCalledWith("telegram_bot_username", "mybot");
  });

  it("не требует secret если уже в БД", async () => {
    vi.mocked(getSetting).mockImplementation(async (key: string) => {
      if (key === "telegram_client_secret") return "existing";
      return undefined;
    });

    const result = await saveTelegramSettings({
      clientId: "99",
      botUsername: "botname",
    });

    expect(result.success).toBe(true);
    expect(setSetting).not.toHaveBeenCalledWith(
      "telegram_client_secret",
      expect.anything(),
    );
  });
});
