/**
 * @fileoverview Проверка прав доступа к общим конфигурациям хранилищ.
 */
import express from "express";
import { rateLimit } from "express-rate-limit";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";

vi.mock("../admin/resolve-admin-key", () => ({ resolveAdminApiKey: () => "test-key" }));
vi.mock("../admin/admin-session", () => ({
  getAdminTokenFromRequest: (req: express.Request) => req.headers["x-test-admin"],
  verifyAdminToken: (token: string) => token === "valid",
}));
vi.mock("./storageConfigs/handlers/listStorageConfigsHandler", () => ({ listStorageConfigsHandler: (_req: express.Request, res: express.Response) => res.status(200).end() }));
vi.mock("./storageConfigs/handlers/createStorageConfigHandler", () => ({ createStorageConfigHandler: (_req: express.Request, res: express.Response) => res.status(204).end() }));
vi.mock("./storageConfigs/handlers/updateStorageConfigHandler", () => ({ updateStorageConfigHandler: (_req: express.Request, res: express.Response) => res.status(204).end() }));
vi.mock("./storageConfigs/handlers/deleteStorageConfigHandler", () => ({ deleteStorageConfigHandler: (_req: express.Request, res: express.Response) => res.status(204).end() }));
vi.mock("./storageConfigs/handlers/testStorageConfigHandler", () => ({ testStorageConfigHandler: (_req: express.Request, res: express.Response) => res.status(204).end() }));

import { requireApiAuth } from "../middleware/requireApiAuth";
import { setupStorageConfigRoutes } from "./setupStorageConfigRoutes";

describe("права доступа к хранилищам", () => {
  let server: Server;
  let base: string;
  const actions = [["POST", ""], ["PATCH", "/s3-1"], ["DELETE", "/s3-1"], ["POST", "/s3-1/test"]] as const;

  beforeAll(async () => {
    const app = express();
    app.use((req, _res, next) => {
      if (req.headers["x-test-user"]) Object.assign(req, { user: { id: 1 } });
      next();
    });
    app.use("/api", rateLimit({ windowMs: 60_000, limit: 1000 }), requireApiAuth);
    setupStorageConfigRoutes(app);
    await new Promise<void>((resolve) => { server = app.listen(0, resolve); });
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/storage-configs`;
  });
  afterAll(async () => { await new Promise<void>((resolve, reject) => server.close((err) => err ? reject(err) : resolve())); });

  it("оставляет список доступным авторизованному пользователю", async () => {
    expect((await fetch(base, { headers: { "x-test-user": "1" } })).status).toBe(200);
    expect((await fetch(base)).status).toBe(401);
  });
  it.each(actions)("запрещает пользователю операцию %s %s", async (method, path) => {
    expect((await fetch(base + path, { method, headers: { "x-test-user": "1" } })).status).toBe(401);
  });
  it.each(actions)("разрешает администратору операцию %s %s", async (method, path) => {
    expect((await fetch(base + path, { method, headers: { "x-test-admin": "valid" } })).status).toBe(204);
  });
  it("ограничивает частоту операций записи и возвращает время ожидания", async () => {
    let response: Response | undefined;
    for (let i = 0; i < 61; i++) response = await fetch(base, { method: "POST", headers: { "x-test-admin": "valid" } });
    expect(response?.status).toBe(429);
    expect(Number(response?.headers.get("retry-after"))).toBeGreaterThan(0);
  });
});
