/** @fileoverview Регрессия потери окружения file-бота после добавления медиа-переменных. */

import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildBotEnvContent, retireBotEnvFile } from "./botEnv";
import { isRemoteProject } from "../bots/botPlacement";
import { prepareBotEnv } from "./prepareBotEnv";

vi.mock("./botEnv", async (original) => ({
  ...await original<typeof import("./botEnv")>(),
  buildBotEnvContent: vi.fn(),
  retireBotEnvFile: vi.fn(),
}));
vi.mock("../bots/botPlacement", () => ({ isRemoteProject: vi.fn(() => false) }));

const directories: string[] = [];
const content = 'BOT_TOKEN=123:bot-secret\nDATABASE_URL=postgresql://bot:pwd@localhost/botdb\nREDIS_URL=redis://localhost:6379\n';
const expected = {
  BOT_TOKEN: "123:bot-secret",
  DATABASE_URL: "postgresql://bot:pwd@localhost/botdb",
  REDIS_URL: "redis://localhost:6379",
};

/** Создаёт временную папку и задаёт ровно содержимое окружения одного бота. */
function setup(mode = "file"): string {
  const directory = mkdtempSync(join(tmpdir(), "bot-env-regression-"));
  directories.push(directory);
  vi.stubEnv("BOT_ENV_SOURCE", mode);
  vi.stubEnv("SESSION_SECRET", "panel-session-secret");
  vi.stubEnv("ADMIN_API_KEY", "panel-admin-key");
  vi.stubEnv("DATABASE_URL", "postgresql://panel:private@other/panel");
  vi.mocked(buildBotEnvContent).mockResolvedValue(content);
  return directory;
}

afterEach(() => {
  // Удаляем только созданные этим тестом временные папки.
  directories.splice(0).forEach(directory => {
    const target = resolve(directory);
    expect(dirname(target)).toBe(resolve(tmpdir()));
    expect(basename(target).startsWith("bot-env-regression-")).toBe(true);
    rmSync(target, { recursive: true, force: true });
  });
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  vi.mocked(isRemoteProject).mockReturnValue(false);
});

describe("prepareBotEnv", () => {
  for (const media of [{ MEDIA_RUNTIME_TOKEN: "media-token", MEDIA_RUNTIME_PROJECT_ID: "39" }, {}]) {
    it(`сохраняет file env при добавлении ${Object.keys(media).length ? "медиа" : "пустого медиа"}`, async () => {
      const directory = setup();
      const result = await prepareBotEnv(directory, 39, 26);
      expect(result.envPath).toBe(join(directory, ".env"));
      expect(readFileSync(result.envPath!, "utf8")).toBe(content);
      const launchEnv = { ...result.env, ...media };
      expect(launchEnv).toEqual({ ...expected, ...media });
      expect(launchEnv).not.toHaveProperty("SESSION_SECRET");
      expect(launchEnv).not.toHaveProperty("ADMIN_API_KEY");
      expect(retireBotEnvFile).not.toHaveBeenCalled();
    });
  }

  for (const remote of [false, true]) {
    it(`сохраняет контракт ${remote ? "удалённого file" : "inline"} запуска`, async () => {
      const directory = setup(remote ? "file" : "inline");
      vi.mocked(isRemoteProject).mockReturnValue(remote);
      const result = await prepareBotEnv(directory, 39, 26);
      expect(result).toEqual({ env: expected });
      expect(retireBotEnvFile).toHaveBeenCalledWith(directory, 39);
    });
  }
});
