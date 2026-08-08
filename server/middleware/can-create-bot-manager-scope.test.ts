/**
 * @fileoverview Тесты canCreateBotManagerScope.
 * @module middleware/can-create-bot-manager-scope.test
 */

import { afterEach, describe, expect, it } from "vitest";
import { canCreateBotManagerScope } from "../routes/agentTokens/can-create-bot-manager-scope";

describe("canCreateBotManagerScope", () => {
  const prevEnv = process.env.NODE_ENV;
  const prevAdmins = process.env.BOT_MANAGER_ADMIN_IDS;

  afterEach(() => {
    process.env.NODE_ENV = prevEnv;
    if (prevAdmins === undefined) delete process.env.BOT_MANAGER_ADMIN_IDS;
    else process.env.BOT_MANAGER_ADMIN_IDS = prevAdmins;
  });

  it("в development разрешает любому", () => {
    process.env.NODE_ENV = "development";
    delete process.env.BOT_MANAGER_ADMIN_IDS;
    expect(canCreateBotManagerScope(123)).toBe(true);
  });

  it("в production только BOT_MANAGER_ADMIN_IDS", () => {
    process.env.NODE_ENV = "production";
    process.env.BOT_MANAGER_ADMIN_IDS = "10, 20";
    expect(canCreateBotManagerScope(10)).toBe(true);
    expect(canCreateBotManagerScope(99)).toBe(false);
  });
});
