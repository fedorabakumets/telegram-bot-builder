/** @fileoverview Проверки нормализации Telegram-профиля перед записью пользователя и сессии. */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request } from "express";

const mocks = vi.hoisted(() => ({ create: vi.fn(), save: vi.fn(), register: vi.fn() }));
vi.mock("../../../storages/storage", () => ({ storage: {
  getTelegramUserOrCreate: mocks.create, migrateGuestProjects: vi.fn(),
} }));
vi.mock("./sessionUtils", () => ({ saveSession: mocks.save, regenerateSession: vi.fn() }));
vi.mock("../../../auth/session-registry", () => ({ registerSession: mocks.register, removeSession: vi.fn() }));
import { applyTelegramLogin, type TelegramLoginProfile } from "./applyTelegramLogin";

/** Возвращает минимальный запрос с уже авторизованным пользователем. */
function request(): Request {
  return { session: { id: "session", telegramUser: { id: 100 } } } as unknown as Request;
}

describe("нормализация Telegram-профиля", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.create.mockResolvedValue({ id: 100, firstName: "Bob" });
  });

  it("преобразует десятичный ID в число и сохраняет имя", async () => {
    await applyTelegramLogin(request(), { id: "100", firstName: "Bob" });
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ id: 100, firstName: "Bob" }));
  });

  it.each([
    [{ id: 100, username: "bob" }, "bob"],
    [{ id: 100 }, "User"],
    [{ id: 100, firstName: "  " }, "User"],
  ] as const)("заполняет обязательное имя для %j", async (profile, firstName) => {
    await applyTelegramLogin(request(), profile);
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ firstName }));
  });

  it.each(["", " ", "1e2", "0x64", "100.5", "-1", "NaN", "9007199254740993", 0, -1, 1.5, Infinity, NaN])(
    "отклоняет некорректный ID %s до записи пользователя и сессии", async (id) => {
      await expect(applyTelegramLogin(request(), { id })).rejects.toThrow("Некорректный Telegram user id");
      expect(mocks.create).not.toHaveBeenCalled();
      expect(mocks.save).not.toHaveBeenCalled();
      expect(mocks.register).not.toHaveBeenCalled();
    },
  );

  it.each([true, null, [100], { valueOf: () => 100 }])(
    "отклоняет неподдерживаемый тип ID %j из тела запроса", async (id) => {
      // Express не гарантирует типы входного JSON, несмотря на интерфейс профиля.
      const profile = { id } as unknown as TelegramLoginProfile;
      await expect(applyTelegramLogin(request(), profile)).rejects.toThrow("Некорректный Telegram user id");
      expect(mocks.create).not.toHaveBeenCalled();
      expect(mocks.save).not.toHaveBeenCalled();
      expect(mocks.register).not.toHaveBeenCalled();
    },
  );
});
