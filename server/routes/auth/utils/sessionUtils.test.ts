/**
 * @fileoverview Тесты sessionUtils
 * @module auth/utils/sessionUtils.test
 */

import { describe, it, expect, vi } from "vitest";
import type { Request } from "express";
import { destroySession, saveSession, regenerateSession } from "./sessionUtils";

describe("sessionUtils", () => {
  it("destroySession resolve при успехе", async () => {
    const req = {
      session: {
        destroy: (cb: (err?: Error) => void) => cb(),
      },
    } as unknown as Request;

    await expect(destroySession(req)).resolves.toBeUndefined();
  });

  it("destroySession resolve без session", async () => {
    const req = {} as unknown as Request;
    await expect(destroySession(req)).resolves.toBeUndefined();
  });

  it("destroySession reject при ошибке", async () => {
    const req = {
      session: {
        destroy: (cb: (err?: Error) => void) => cb(new Error("fail")),
      },
    } as unknown as Request;

    await expect(destroySession(req)).rejects.toThrow("fail");
  });

  it("saveSession и regenerateSession работают", async () => {
    const req = {
      session: {
        save: (cb: (err?: Error) => void) => cb(),
        regenerate: (cb: (err?: Error) => void) => cb(),
      },
    } as unknown as Request;

    await expect(saveSession(req)).resolves.toBeUndefined();
    await expect(regenerateSession(req)).resolves.toBeUndefined();
  });

  it("после создания новой сессии сохраняет вход по прямому локальному HTTP", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("COOKIE_SECURE", undefined);
    vi.stubEnv("API_BASE_URL", undefined);
    vi.stubEnv("WEBHOOK_BASE_URL", undefined);
    vi.stubEnv("RAILWAY_PUBLIC_DOMAIN", undefined);
    vi.stubEnv("RAILWAY_STATIC_URL", undefined);
    const cookie = { secure: true, httpOnly: true, sameSite: "none" };
    const req = {
      secure: false,
      headers: { host: "127.0.0.1:5000" },
      socket: { localAddress: "127.0.0.1", remoteAddress: "127.0.0.1" },
      session: { cookie, regenerate: (cb: () => void) => cb() },
    } as unknown as Request;
    try {
      await regenerateSession(req);
      expect(cookie).toEqual({ secure: false, httpOnly: true, sameSite: "lax" });
    } finally { vi.unstubAllEnvs(); }
  });
});
