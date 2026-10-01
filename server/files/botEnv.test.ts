/**
 * @fileoverview Тесты режима передачи переменных бота и разбора .env
 * @module server/files/botEnv.test
 */

import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getBotEnvSource, parseBotEnv, readLegacyAdminIds } from "./botEnv";

/**
 * Создаёт временную папку бота с заданным .env
 * @param content - Содержимое .env или null, если файла нет
 * @returns Путь к папке
 */
function botDirWith(content: string | null): string {
  const dir = mkdtempSync(join(tmpdir(), "bot-env-"));
  if (content !== null) writeFileSync(join(dir, ".env"), content, "utf8");
  return dir;
}

describe("getBotEnvSource", () => {
  it("по умолчанию — файл", () => {
    expect(getBotEnvSource({})).toBe("file");
    expect(getBotEnvSource({ BOT_ENV_SOURCE: "something" })).toBe("file");
  });

  it("inline только при явном значении", () => {
    expect(getBotEnvSource({ BOT_ENV_SOURCE: " Inline " })).toBe("inline");
  });
});

describe("readLegacyAdminIds", () => {
  it("нет файла — null", () => {
    expect(readLegacyAdminIds(botDirWith(null))).toBeNull();
  });

  it("заглушка не считается администратором", () => {
    expect(readLegacyAdminIds(botDirWith("ADMIN_IDS=123456789\n"))).toBeNull();
  });

  it("возвращает реальные ID", () => {
    expect(readLegacyAdminIds(botDirWith("BOT_TOKEN=x\nADMIN_IDS=1,2\n"))).toBe("1,2");
  });
});

describe("parseBotEnv", () => {
  it("разбирает текст так же, как load_dotenv", () => {
    const env = parseBotEnv('# комментарий\nBOT_TOKEN=1:abc\nTEXT="a b"\nEMPTY=\n');
    expect(env).toEqual({ BOT_TOKEN: "1:abc", TEXT: "a b", EMPTY: "" });
  });
});
