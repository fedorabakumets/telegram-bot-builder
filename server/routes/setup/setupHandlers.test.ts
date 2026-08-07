/**
 * @fileoverview Тесты setupHandlers
 * @module server/routes/setup/setupHandlers.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";

vi.mock("../../services/app-settings.service", () => ({
  isConfigured: vi.fn(),
}));

vi.mock("../../admin/resolve-admin-key", () => ({
  isAdminEnabled: vi.fn(),
}));

import {
  handleGetSetupBootstrap,
  handleGetSetupStatus,
} from "./setupHandlers";
import { isConfigured } from "../../services/app-settings.service";
import { isAdminEnabled } from "../../admin/resolve-admin-key";

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

describe("handleGetSetupBootstrap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("возвращает configured и adminEnabled", async () => {
    vi.mocked(isConfigured).mockResolvedValue(false);
    vi.mocked(isAdminEnabled).mockReturnValue(true);
    const res = mockRes();

    await handleGetSetupBootstrap({} as Request, res);

    expect(res.json).toHaveBeenCalledWith({
      configured: false,
      adminEnabled: true,
    });
  });
});
