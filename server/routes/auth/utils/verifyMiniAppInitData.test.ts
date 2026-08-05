/**
 * @fileoverview Тесты verifyMiniAppInitData
 * @module auth/utils/verifyMiniAppInitData.test
 */

import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { verifyMiniAppInitData } from "./verifyMiniAppInitData";

/**
 * Собирает валидный initData для тестов
 * @param botToken - Токен бота
 * @param userJson - JSON пользователя
 * @returns Строка initData
 */
function buildInitData(botToken: string, userJson: string): string {
  const params = new URLSearchParams();
  params.set("user", userJson);
  params.set("auth_date", "1710000000");

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const hash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  params.set("hash", hash);
  return params.toString();
}

describe("verifyMiniAppInitData", () => {
  const botToken = "123456:ABC-DEF";

  it("принимает валидный initData", () => {
    const initData = buildInitData(botToken, JSON.stringify({ id: 1, first_name: "A" }));
    expect(verifyMiniAppInitData(initData, botToken)).toBe(true);
  });

  it("отклоняет подделанный initData", () => {
    const initData = buildInitData(botToken, JSON.stringify({ id: 1, first_name: "A" }));
    const tampered = initData.replace("first_name%22%3A%22A", "first_name%22%3A%22B");
    expect(verifyMiniAppInitData(tampered, botToken)).toBe(false);
  });

  it("отклоняет без hash", () => {
    expect(verifyMiniAppInitData("user=%7B%7D", botToken)).toBe(false);
  });
});
