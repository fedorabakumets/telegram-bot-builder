/**
 * @fileoverview CLI: создать площадку (исполнитель + Redis + PostgreSQL) в аккаунте Railway по токену
 *
 * Использование:
 *   npm run site:create -- --token <токен> [--name tbb-site] [--region europe-west4-drams3a]
 *     [--workspace <id>] [--runner-image <образ>] [--keep-on-failure] [--show-secrets]
 * Без --token берётся RAILWAY_SITE_TOKEN. Токен — аккаунта или workspace (не проекта).
 * @module scripts/site-create
 */

import "dotenv/config";

/**
 * Достаёт значение аргумента командной строки.
 * @param name - Имя флага (например, --token)
 * @returns Значение или undefined
 */
function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

/**
 * Скрывает пароль в адресе подключения
 * @param url - Адрес вида scheme://user:pass@host
 * @returns адрес с *** вместо пароля
 */
function maskUrl(url: string | undefined): string {
  return url ? url.replace(/:\/\/([^:@/]+):[^@]+@/, "://$1:***@") : "—";
}

/**
 * Печатает шаг с меткой команды.
 * @param message - Текст шага
 */
function log(message: string): void {
  console.log(`🚉 ${message}`);
}

/**
 * Точка входа: создаёт площадку и печатает её адреса.
 */
async function main(): Promise<void> {
  const token = argValue("--token") ?? process.env.RAILWAY_SITE_TOKEN?.trim();
  if (!token) throw new Error("Укажите --token или RAILWAY_SITE_TOKEN");
  const show = process.argv.includes("--show-secrets") ? (url?: string) => url ?? "—" : maskUrl;
  const { createRailwaySite } = await import("../server/sites/railway/createRailwaySite");
  const started = Date.now();
  const site = await createRailwaySite({
    auth: { token },
    name: argValue("--name") ?? "tbb-site",
    region: argValue("--region"),
    workspaceId: argValue("--workspace"),
    runnerImage: argValue("--runner-image"),
    keepOnFailure: process.argv.includes("--keep-on-failure"),
    onProgress: log,
  });
  log(`✅ площадка готова за ${Math.round((Date.now() - started) / 1000)} с`);
  log(`проект ${site.projectId}, регион ${site.region}`);
  log(`REDIS_PUBLIC_URL ${show(site.redisPublicUrl)}`);
  for (const runner of site.runners) {
    log(`исполнитель ${runner.runnerId} (${runner.platform}${runner.region ? `, ${runner.region}` : ""})`);
    log(`  база снаружи ${show(runner.databasePublicUrl)}`);
    log(`  база для ботов ${show(runner.botDatabaseUrl)}`);
  }
}

main().catch((error) => {
  console.error(`🚉 ❌ ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
