/**
 * @fileoverview Запуск `pg_dump` и `pg_restore` с дампом в памяти
 *
 * Пароль передаётся через `PGPASSWORD`, а не в аргументах: аргументы
 * процесса видны всем пользователям машины через `ps`.
 * @module server/database/backups/pgDumpRestore
 */

import { spawn } from "child_process";
import { findPgBinaries } from "./pgBinaries";

/** Строка подключения без пароля и сам пароль */
export interface SplitConnection {
  /** Строка подключения без пароля */
  url: string;
  /** Пароль или null */
  password: string | null;
}

/**
 * Отделяет пароль от строки подключения.
 * @param databaseUrl - Строка подключения `postgres://user:pass@host/db`
 * @returns Строка без пароля и пароль
 */
export function splitConnectionPassword(databaseUrl: string): SplitConnection {
  const parsed = new URL(databaseUrl);
  const password = parsed.password ? decodeURIComponent(parsed.password) : null;
  parsed.password = "";
  return { url: parsed.toString(), password };
}

/**
 * Запускает утилиту, подаёт ей данные на stdin и собирает stdout.
 * @param command - Путь к утилите
 * @param args - Аргументы без строки подключения
 * @param databaseUrl - Строка подключения или null, если утилите база не нужна
 * @param input - Данные для stdin или null
 * @returns Содержимое stdout
 * @throws С текстом stderr, если утилита завершилась с ошибкой
 */
function runTool(command: string, args: string[], databaseUrl: string | null, input: Buffer | null): Promise<Buffer> {
  const split = databaseUrl ? splitConnectionPassword(databaseUrl) : null;
  const env = { ...process.env, ...(split?.password != null ? { PGPASSWORD: split.password } : {}) };
  const fullArgs = split ? [...args, `--dbname=${split.url}`] : args;
  return new Promise((resolve, reject) => {
    const child = spawn(command, fullArgs, { stdio: ["pipe", "pipe", "pipe"], env });
    const out: Buffer[] = [];
    const err: Buffer[] = [];
    child.stdout.on("data", (chunk: Buffer) => out.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => err.push(chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) return resolve(Buffer.concat(out));
      const message = Buffer.concat(err).toString("utf8").trim().split("\n").slice(-5).join("\n");
      reject(new Error(`${command.split("/").pop()} завершился с кодом ${code}: ${message}`));
    });
    child.stdin.on("error", () => undefined);
    child.stdin.end(input ?? undefined);
  });
}

/**
 * Снимает дамп базы в формате custom (`-Fc`, сжатый) без владельцев и прав.
 * @param databaseUrl - Строка подключения к базе
 * @param snapshot - Имя экспортированного снимка (`pg_export_snapshot()`) или null
 * @returns Содержимое дампа
 */
export function runPgDump(databaseUrl: string, snapshot: string | null): Promise<Buffer> {
  const { pgDump } = findPgBinaries();
  const args = ["--format=custom", "--no-owner", "--no-privileges"];
  if (snapshot) args.push(`--snapshot=${snapshot}`);
  return runTool(pgDump, args, databaseUrl, null);
}

/** Параметры восстановления */
export interface PgRestoreOptions {
  /** Удалить существующие объекты перед созданием (`--clean --if-exists`) */
  clean: boolean;
  /** Основная версия целевого сервера */
  targetMajor: number;
}

/** Настройки сессии, которых нет в серверах старше указанной версии */
const SESSION_SETTINGS_SINCE: Array<[RegExp, number]> = [[/^SET transaction_timeout = 0;$/m, 17]];

/**
 * Убирает из SQL-скрипта настройки сессии, неизвестные целевому серверу.
 * @param script - SQL-скрипт от `pg_restore --file=-`
 * @param targetMajor - Основная версия целевого сервера
 * @returns Скрипт для целевого сервера
 */
export function adaptScriptForServer(script: string, targetMajor: number): string {
  return SESSION_SETTINGS_SINCE.reduce(
    (text, [pattern, since]) => (targetMajor < since ? text.replace(pattern, "") : text),
    script,
  );
}

/**
 * Восстанавливает дамп в базу одной транзакцией: при ошибке база не меняется.
 *
 * Если сервер старше `pg_restore`, дамп разворачивается в SQL, из него убираются
 * неизвестные серверу настройки сессии, и скрипт выполняется через `psql`.
 * @param databaseUrl - Строка подключения к целевой базе
 * @param dump - Содержимое дампа формата custom
 * @param options - Параметры восстановления
 */
export async function runPgRestore(databaseUrl: string, dump: Buffer, options: PgRestoreOptions): Promise<void> {
  const { pgRestore, psql, major } = findPgBinaries();
  const args = ["--no-owner", "--no-privileges"];
  if (options.clean) args.push("--clean", "--if-exists");
  if (major === null || options.targetMajor >= major) {
    await runTool(pgRestore, [...args, "--single-transaction", "--exit-on-error"], databaseUrl, dump);
    return;
  }
  const script = (await runTool(pgRestore, [...args, "--file=-"], null, dump)).toString("utf8");
  const adapted = Buffer.from(adaptScriptForServer(script, options.targetMajor), "utf8");
  await runTool(psql, ["--no-psqlrc", "--quiet", "--single-transaction", "--set=ON_ERROR_STOP=1"], databaseUrl, adapted);
}
