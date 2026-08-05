/**
 * @fileoverview Тесты meHandler
 * @module auth/handlers/meHandler.test
 */

import { describe, it, expect, vi } from "vitest";
import { handleMe } from "./meHandler";
import type { Request, Response } from "express";

/**
 * Создаёт mock Response
 * @returns Mock res с json/status
 */
function mockRes() {
  const res = {
    json: vi.fn().mockReturnThis(),
    status: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response & { json: ReturnType<typeof vi.fn>; status: ReturnType<typeof vi.fn> };
}

describe("handleMe", () => {
  it("возвращает user из session", async () => {
    const user = { id: 1, firstName: "Ivan" };
    const req = { session: { telegramUser: user } } as unknown as Request;
    const res = mockRes();

    await handleMe(req, res);

    expect(res.json).toHaveBeenCalledWith({ user });
  });

  it("возвращает null без сессии", async () => {
    const req = {} as unknown as Request;
    const res = mockRes();

    await handleMe(req, res);

    expect(res.json).toHaveBeenCalledWith({ user: null });
  });
});
