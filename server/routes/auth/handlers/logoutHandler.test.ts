/**
 * @fileoverview Тесты logoutHandler
 * @module auth/handlers/logoutHandler.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";

vi.mock("../utils/sessionUtils", () => ({
  destroySession: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../../utils/resolveSessionCookie", () => ({
  shouldUseSecureSessionCookie: vi.fn().mockReturnValue(false),
}));

import { handleLogout } from "./logoutHandler";
import { destroySession } from "../utils/sessionUtils";

describe("handleLogout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("уничтожает сессию и очищает cookie", async () => {
    const req = {} as unknown as Request;
    const res = {
      clearCookie: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response & {
      clearCookie: ReturnType<typeof vi.fn>;
      json: ReturnType<typeof vi.fn>;
    };

    await handleLogout(req, res);

    expect(destroySession).toHaveBeenCalledWith(req);
    expect(res.clearCookie).toHaveBeenCalledWith(
      "connect.sid",
      expect.objectContaining({ httpOnly: true, path: "/" }),
    );
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Выход выполнен",
    });
  });
});
