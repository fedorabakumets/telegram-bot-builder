/**
 * @fileoverview Тесты resolveBotApiActor / hasBotManagerScope.
 * @module middleware/bot-api-actor.test
 */

import { describe, it, expect, vi } from "vitest";
import type { Request, Response } from "express";
import {
  hasBotManagerScope,
  resolveBotApiActor,
  getBotActorId,
} from "./bot-api-actor";

/**
 * Mock Response
 * @returns res с status/json
 */
function mockRes() {
  const res = {
    json: vi.fn().mockReturnThis(),
    status: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response & {
    json: ReturnType<typeof vi.fn>;
    status: ReturnType<typeof vi.fn>;
  };
}

describe("hasBotManagerScope", () => {
  it("true при scope bot_manager", () => {
    const req = { agentScopes: "read,write,bot_manager" } as Request;
    expect(hasBotManagerScope(req)).toBe(true);
  });

  it("false без scope", () => {
    const req = { agentScopes: "read,write" } as Request;
    expect(hasBotManagerScope(req)).toBe(false);
  });
});

describe("resolveBotApiActor", () => {
  it("личный PAT: actor = user.id без telegram_id", () => {
    const req = {
      user: { id: 42 },
      agentScopes: "read,write",
      query: {},
    } as unknown as Request;
    const res = mockRes();
    const next = vi.fn();

    resolveBotApiActor(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(getBotActorId(req)).toBe(42);
  });

  it("личный PAT: чужой telegram_id → 403", () => {
    const req = {
      user: { id: 42 },
      agentScopes: "read,write",
      query: { telegram_id: "99" },
    } as unknown as Request;
    const res = mockRes();
    const next = vi.fn();

    resolveBotApiActor(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("личный PAT: свой telegram_id → ok", () => {
    const req = {
      user: { id: 42 },
      agentScopes: "read,write",
      query: { telegram_id: "42" },
    } as unknown as Request;
    const res = mockRes();
    const next = vi.fn();

    resolveBotApiActor(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(getBotActorId(req)).toBe(42);
  });

  it("bot_manager: без telegram_id → 400", () => {
    const req = {
      user: { id: 1 },
      agentScopes: "read,write,bot_manager",
      query: {},
    } as unknown as Request;
    const res = mockRes();
    const next = vi.fn();

    resolveBotApiActor(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("bot_manager: telegram_id чужого юзера → actor = query", () => {
    const req = {
      user: { id: 1 },
      agentScopes: "bot_manager",
      query: { telegram_id: "777" },
    } as unknown as Request;
    const res = mockRes();
    const next = vi.fn();

    resolveBotApiActor(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(getBotActorId(req)).toBe(777);
  });

  it("без user → 401", () => {
    const req = { query: {} } as unknown as Request;
    const res = mockRes();
    const next = vi.fn();

    resolveBotApiActor(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
