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
});
