/**
 * @fileoverview Предкомпиляция bot.py в кэш байткода в отдельном коротком процессе
 * @module server/bots/precompileBotCode
 */

import { execFile } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** Каталог с worker.py и bot_code_cache.py */
const PYTHON_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "python");

/** Таймаут предкомпиляции (мс) */
const PRECOMPILE_TIMEOUT_MS = 60_000;

/** Скрипт: создаёт .botcode/*.bin тем же кодом, которым воркер его читает */
const PRECOMPILE_SCRIPT = [
  "import sys",
  "from pathlib import Path",
  "sys.path.insert(0, sys.argv[1])",
  "import bot_code_cache",
  "bot_code_cache.load_bot_code(Path(sys.argv[2]), lambda _m: None)",
].join("\n");

/**
 * Компилирует bot.py в кэш байткода вне воркера (отключается BOT_PRECOMPILE=false).
 * Память на разбор большого файла освобождается вместе с коротким процессом,
 * а не остаётся в долгоживущем воркере. Ошибки не прерывают запуск:
 * без кэша воркер скомпилирует файл сам.
 * @param mainFile - Путь к сгенерированному bot.py
 * @returns true, если кэш создан или уже актуален
 */
export async function precompileBotCode(mainFile: string): Promise<boolean> {
  if (process.env.BOT_CODE_CACHE === "false" || process.env.BOT_PRECOMPILE === "false") {
    return false;
  }
  const pythonPath =
    process.env.PYTHON_PATH || (process.platform === "win32" ? "python" : "python3");
  const startedAt = Date.now();
  try {
    await execFileAsync(pythonPath, ["-c", PRECOMPILE_SCRIPT, PYTHON_DIR, mainFile], {
      timeout: PRECOMPILE_TIMEOUT_MS,
    });
    console.log(`🧩 Байткод подготовлен вне воркера за ${Date.now() - startedAt} мс: ${mainFile}`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️ Предкомпиляция не удалась, воркер скомпилирует сам: ${message}`);
    return false;
  }
}
