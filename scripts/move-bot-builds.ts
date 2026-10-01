/**
 * @fileoverview CLI: перенос сборок ботов в другое хранилище
 *
 * Использование:
 *   npm run bot-builds:move -- --to <storageConfigId> [--dry-run] [--keep-source]
 * Без --to берётся BOT_BUILDS_STORAGE_ID. Чтобы вернуть сборки в приватную папку: --to bot-builds-local.
 * @module scripts/move-bot-builds
 */

import "dotenv/config";

/**
 * Достаёт значение аргумента командной строки.
 * @param name - Имя флага (например, --to)
 * @returns Значение или undefined
 */
function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

/**
 * Точка входа: переносит сборки и печатает итог.
 */
async function main(): Promise<void> {
  const targetId = argValue("--to") ?? process.env.BOT_BUILDS_STORAGE_ID?.trim();
  if (!targetId) {
    console.error("❌ Укажите --to <storageConfigId> или BOT_BUILDS_STORAGE_ID");
    process.exit(1);
  }

  const repo = await import("../server/bots/builds/botBuildsRepo");
  const { resolveBotBuildsBackend } = await import("../server/bots/builds/botBuildsBackend");
  const { moveBotBuilds } = await import("../server/bots/builds/moveBotBuilds");

  const result = await moveBotBuilds(
    targetId,
    {
      listOutside: repo.listBotBuildsOutside,
      setStorage: repo.setBotBuildStorage,
      resolveBackend: resolveBotBuildsBackend,
    },
    {
      dryRun: process.argv.includes("--dry-run"),
      keepSource: process.argv.includes("--keep-source"),
      log: (message) => console.log(`📦 ${message}`),
    },
  );
  console.log(`✅ Итог: перенесено ${result.moved}, ошибок ${result.failed}, всего ${result.total}`);
  process.exit(result.failed > 0 ? 2 : 0);
}

main().catch((error) => {
  console.error("❌ Перенос сборок не выполнен:", error instanceof Error ? error.message : error);
  process.exit(1);
});
