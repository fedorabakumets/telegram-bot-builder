/** @fileoverview Проверки временного отказа настройки на настоящем HTTP-сервере Express 4. */
import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/app-settings.service", () => ({ isConfigured: vi.fn() }));
vi.mock("../admin/resolve-admin-key", () => ({ isAdminEnabled: vi.fn(() => true) }));

import { isConfigured } from "../services/app-settings.service";
import { isAdminEnabled } from "../admin/resolve-admin-key";
import { redirectAfterAdminLogin } from "../admin/admin-login-redirect";
import { handleGetSetupBootstrap, handleGetSetupStatus } from "../routes/setup/setupHandlers";
import { setupGuard } from "./setup-guard";

/** Проверяет HTTP-поведение без подмены обработки асинхронных ошибок Express. */
describe("отказ и восстановление проверки настройки", () => {
  let server: Server;
  let base: string;
  const protectedHandler = vi.fn();

  beforeAll(async () => {
    const app = express();
    app.use("/api", setupGuard);
    app.get("/api/setup/status", handleGetSetupStatus);
    app.get("/api/setup/bootstrap", handleGetSetupBootstrap);
    app.get("/admin/redirect", redirectAfterAdminLogin);
    app.get("/api/private", (_req, res) => {
      protectedHandler();
      res.status(401).json({ message: "Требуется авторизация" });
    });
    app.get("/api/health", (_req, res) => { res.json({ alive: true }); });
    app.get("/api/auth/login", (_req, res) => { res.status(401).end(); });
    server = await new Promise<Server>((resolve) => {
      const started = app.listen(0, "127.0.0.1", () => resolve(started));
    });
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Не определён тестовый порт");
    base = `http://127.0.0.1:${address.port}`;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isConfigured).mockResolvedValue(true);
  });

  afterAll(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  });

  it.each(["/api/private", "/api/setup/status", "/api/setup/bootstrap", "/admin/redirect"])(
    "%s отвечает безопасным 503 и восстанавливается без перезапуска",
    async (path) => {
      vi.mocked(isConfigured).mockRejectedValueOnce(new Error("SQL secret timeout"));
      const failed = await fetch(base + path, { redirect: "manual" });
      expect(failed.status).toBe(503);
      expect(failed.headers.get("cache-control")).toBe("no-store");
      expect(failed.headers.get("retry-after")).toBe("5");
      expect(failed.headers.get("location")).toBeNull();
      const payload = await failed.json();
      expect(payload).not.toHaveProperty("setupRequired");
      expect(JSON.stringify(payload)).not.toContain("SQL secret");
      expect(protectedHandler).not.toHaveBeenCalled();
      expect(isConfigured).toHaveBeenCalledTimes(1);
      expect(isAdminEnabled).not.toHaveBeenCalled();

      const recovered = await fetch(base + path, { redirect: "manual" });
      expect(recovered.status).toBe(path === "/api/private" ? 401 : path === "/admin/redirect" ? 302 : 200);
      expect(isConfigured).toHaveBeenCalledTimes(2);
    },
  );

  it("сохраняет отказ настройки отдельно от ошибки хранилища", async () => {
    vi.mocked(isConfigured).mockResolvedValue(false);
    const response = await fetch(base + "/api/private");
    expect(response.status).toBe(503);
    expect(await response.json()).toHaveProperty("setupRequired", true);
    expect(protectedHandler).not.toHaveBeenCalled();
  });

  it("не блокирует исключённые health и auth и не вызывает проверку для них", async () => {
    vi.mocked(isConfigured).mockRejectedValue(new Error("Недоступна БД"));
    expect((await fetch(base + "/api/health")).status).toBe(200);
    expect((await fetch(base + "/api/auth/login")).status).toBe(401);
    expect(isConfigured).not.toHaveBeenCalled();
  });

  it("вычисляет bootstrap ровно один раз после успешной проверки", async () => {
    const response = await fetch(base + "/api/setup/bootstrap");
    expect(await response.json()).toEqual({ configured: true, adminEnabled: true });
    expect(isConfigured).toHaveBeenCalledTimes(1);
    expect(isAdminEnabled).toHaveBeenCalledTimes(1);
  });

  it("сохраняет перенаправление админа при действительно отсутствующей настройке", async () => {
    vi.mocked(isConfigured).mockResolvedValue(false);
    const response = await fetch(base + "/admin/redirect", { redirect: "manual" });
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("/admin/settings");
    expect(isConfigured).toHaveBeenCalledTimes(1);
  });
});
