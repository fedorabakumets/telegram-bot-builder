/**
 * @fileoverview Тесты setupHandlers
 * @module server/routes/setup/setupHandlers.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";

vi.mock("../../services/app-settings.service", () => ({
  isConfigured: vi.fn(),
  setSetting: vi.fn().mockResolvedValue(undefined),
}));

import { handleGetSetupStatus, handlePostSetup } from "./setupHandlers";
import { isConfigured, setSetting } from "../../services/app-settings.service";

function mockRes() {
  const res = {
    json: vi.fn().mockReturnThis(),
    status: vi.fn().mockReturnThis(),
  } as unknown as Response & {
    json: ReturnType<typeof vi.fn>;
    status: ReturnType<typeof vi.fn>;
  };
  return res;
}

describe("handleGetSetupStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("возвращает configured из isConfigured", async () => {
    vi.mocked(isConfigured).mockResolvedValue(true);
    const res = mockRes();

    await handleGetSetupStatus({} as Request, res);

    expect(res.json).toHaveBeenCalledWith({ configured: true });
  });
});

describe("handlePostSetup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("возвращает 409 если уже настроено", async () => {
    vi.mocked(isConfigured).mockResolvedValue(true);
    const req = { body: {} } as Request;
    const res = mockRes();

    await handlePostSetup(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: "Приложение уже настроено" });
    expect(setSetting).not.toHaveBeenCalled();
  });

  it("возвращает 400 при пустом telegramClientId", async () => {
    vi.mocked(isConfigured).mockResolvedValue(false);
    const req = {
      body: {
        telegramClientId: "",
        telegramClientSecret: "secret",
        telegramBotUsername: "bot",
      },
    } as Request;
    const res = mockRes();

    await handlePostSetup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(setSetting).not.toHaveBeenCalled();
  });

  it("сохраняет настройки и опциональный bot token", async () => {
    vi.mocked(isConfigured).mockResolvedValue(false);
    const req = {
      body: {
        telegramClientId: "12345",
        telegramClientSecret: "secret",
        telegramBotUsername: "@mybot",
        telegramBotToken: "123:TOKEN",
      },
    } as Request;
    const res = mockRes();

    await handlePostSetup(req, res);

    expect(setSetting).toHaveBeenCalledWith("telegram_client_id", "12345");
    expect(setSetting).toHaveBeenCalledWith("telegram_client_secret", "secret");
    expect(setSetting).toHaveBeenCalledWith("telegram_bot_username", "mybot");
    expect(setSetting).toHaveBeenCalledWith("telegram_bot_token", "123:TOKEN");
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it("не сохраняет bot token если поле пустое", async () => {
    vi.mocked(isConfigured).mockResolvedValue(false);
    const req = {
      body: {
        telegramClientId: "12345",
        telegramClientSecret: "secret",
        telegramBotUsername: "mybot",
        telegramBotToken: "",
      },
    } as Request;
    const res = mockRes();

    await handlePostSetup(req, res);

    expect(setSetting).not.toHaveBeenCalledWith(
      "telegram_bot_token",
      expect.anything(),
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
