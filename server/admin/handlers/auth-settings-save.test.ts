/**
 * @fileoverview Тесты saveAuthLoginMode
 * @module server/admin/handlers/auth-settings-save.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../services/app-settings.service", () => ({
  AUTH_LOGIN_MODES: ["dev_login", "telegram_widget"],
  setSetting: vi.fn().mockResolvedValue(undefined),
  refreshAuthLoginCache: vi.fn().mockResolvedValue(undefined),
}));

import {
  refreshAuthLoginCache,
  setSetting,
} from "../../services/app-settings.service";
import { saveAuthLoginMode } from "./auth-settings-save";

describe("saveAuthLoginMode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("возвращает ошибку при неверном режиме", async () => {
    const result = await saveAuthLoginMode("invalid");
    expect(result.success).toBe(false);
    expect(setSetting).not.toHaveBeenCalled();
  });

  it("сохраняет dev_login и обновляет кэш", async () => {
    const result = await saveAuthLoginMode("dev_login");
    expect(result.success).toBe(true);
    expect(result.loginMode).toBe("dev_login");
    expect(setSetting).toHaveBeenCalledWith("auth_login_mode", "dev_login");
    expect(refreshAuthLoginCache).toHaveBeenCalled();
  });

  it("сохраняет telegram_widget", async () => {
    const result = await saveAuthLoginMode("telegram_widget");
    expect(result.success).toBe(true);
    expect(setSetting).toHaveBeenCalledWith(
      "auth_login_mode",
      "telegram_widget",
    );
  });
});
