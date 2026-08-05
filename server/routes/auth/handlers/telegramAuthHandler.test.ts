/**
 * @fileoverview Тесты telegramAuthHandler (login / switch / proof)
 * @module auth/handlers/telegramAuthHandler.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Request, Response } from "express";

const regenerateSession = vi.fn().mockResolvedValue(undefined);
const saveSession = vi.fn().mockResolvedValue(undefined);
const verifyTelegramIdToken = vi.fn();
const isStrictAuthMode = vi.fn().mockReturnValue(false);
const getTelegramUserOrCreate = vi.fn();
const migrateGuestProjects = vi.fn().mockResolvedValue(undefined);

vi.mock("../utils/sessionUtils", () => ({
  regenerateSession: (...args: unknown[]) => regenerateSession(...args),
  saveSession: (...args: unknown[]) => saveSession(...args),
}));

vi.mock("../utils/telegramJwks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../utils/telegramJwks")>();
  return {
    ...actual,
    verifyTelegramIdToken: (...args: unknown[]) => verifyTelegramIdToken(...args),
  };
});

vi.mock("../utils/isStrictAuthMode", () => ({
  isStrictAuthMode: () => isStrictAuthMode(),
}));

vi.mock("../../../storages/storage", () => ({
  storage: {
    getTelegramUserOrCreate: (...args: unknown[]) => getTelegramUserOrCreate(...args),
    migrateGuestProjects: (...args: unknown[]) => migrateGuestProjects(...args),
  },
}));

import { handleTelegramAuth } from "./telegramAuthHandler";

/**
 * Создаёт mock Response
 * @returns Mock res
 */
function mockRes() {
  return {
    json: vi.fn().mockReturnThis(),
    status: vi.fn().mockReturnThis(),
  } as unknown as Response & {
    json: ReturnType<typeof vi.fn>;
    status: ReturnType<typeof vi.fn>;
  };
}

describe("handleTelegramAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isStrictAuthMode.mockReturnValue(false);
    getTelegramUserOrCreate.mockResolvedValue({
      id: 100,
      firstName: "Bob",
    });
  });

  afterEach(() => {
    isStrictAuthMode.mockReturnValue(false);
  });

  it("guest → user: без regenerate, switched false", async () => {
    const req = {
      body: { id: 100, first_name: "Bob" },
      session: { id: "sid-1", telegramUser: undefined },
    } as unknown as Request;
    const res = mockRes();

    await handleTelegramAuth(req, res);

    expect(regenerateSession).not.toHaveBeenCalled();
    expect(saveSession).toHaveBeenCalled();
    expect(migrateGuestProjects).toHaveBeenCalledWith("sid-1", 100);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, switched: false }),
    );
  });

  it("same user: без regenerate, switched false", async () => {
    const req = {
      body: { id: 100, first_name: "Bob" },
      session: { id: "sid-1", telegramUser: { id: 100 } },
    } as unknown as Request;
    const res = mockRes();

    await handleTelegramAuth(req, res);

    expect(regenerateSession).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ switched: false }),
    );
  });

  it("A→B: regenerate и switched true", async () => {
    getTelegramUserOrCreate.mockResolvedValue({ id: 200, firstName: "Ann" });
    const req = {
      body: { id: 200, first_name: "Ann" },
      session: { id: "sid-old", telegramUser: { id: 100 } },
    } as unknown as Request;
    const res = mockRes();

    await handleTelegramAuth(req, res);

    expect(regenerateSession).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, switched: true }),
    );
  });

  it("strict prod без id_token → 401", async () => {
    isStrictAuthMode.mockReturnValue(true);
    const req = {
      body: { id: 100, first_name: "Bob" },
      session: { id: "sid-1" },
    } as unknown as Request;
    const res = mockRes();

    await handleTelegramAuth(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(getTelegramUserOrCreate).not.toHaveBeenCalled();
  });

  it("с валидным id_token → 200", async () => {
    isStrictAuthMode.mockReturnValue(true);
    verifyTelegramIdToken.mockResolvedValue({ sub: "oidc-sub", id: 100 });
    const req = {
      body: { id: 100, first_name: "Bob", id_token: "jwt" },
      session: { id: "sid-1" },
    } as unknown as Request;
    const res = mockRes();

    await handleTelegramAuth(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true }),
    );
  });

  it("id_token: sub отличается, но id совпадает → 200", async () => {
    isStrictAuthMode.mockReturnValue(true);
    verifyTelegramIdToken.mockResolvedValue({ sub: "long-oidc-sub", id: 100 });
    const req = {
      body: { id: 100, first_name: "Bob", id_token: "jwt" },
      session: { id: "sid-1" },
    } as unknown as Request;
    const res = mockRes();

    await handleTelegramAuth(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true }),
    );
  });
});
