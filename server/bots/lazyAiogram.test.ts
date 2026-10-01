/**
 * @fileoverview Тесты ленивой сборки моделей aiogram в воркере (server/python/lazy_aiogram.py).
 * Ловят поломку патча после обновления pydantic/aiogram: все модели должны собираться,
 * а запросы к Bot API — сериализоваться так же, как без патча.
 * @module server/bots/lazyAiogram.test
 */

import { before, describe, it } from "node:test";
import assert from "node:assert";
import { execFile, execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** Скрипт проверки рядом с worker.py */
const CHECK_SCRIPT = join(dirname(fileURLToPath(import.meta.url)), "..", "python", "lazy_aiogram_check.py");

/** Интерпретатор Python, как в воркере */
const PYTHON = process.env.PYTHON_PATH || (process.platform === "win32" ? "python" : "python3");

/** Результат lazy_aiogram_check.py */
interface CheckResult {
  /** Режим проверки: "lazy", "eager" или "disabled" */
  mode: string;
  /** Что вернул lazy_aiogram.enable() (null в режиме eager) */
  applied: boolean | null;
  /** Прирост RSS на импорт aiogram, МБ (0 вне Linux) */
  import_mb: number;
  /** Число моделей pydantic в aiogram.types и aiogram.methods */
  models: number;
  /** Сколько моделей не собрано сразу после импорта */
  incomplete_after_import: number;
  /** Собирается ли сразу модель, объявленная после патча */
  own_model_complete: boolean;
  /** Текст кнопки из разобранного апдейта или строка "ERROR: ..." */
  button_text: string;
  /** JSON типовых запросов Bot API или строка "ERROR: ..." */
  requests: string[] | string;
  /** Ошибки принудительной сборки всех моделей */
  build_errors: string[];
}

/**
 * Проверяет, установлен ли aiogram в окружении Python
 * @returns true, если aiogram импортируется
 */
function hasAiogram(): boolean {
  try {
    execFileSync(PYTHON, ["-c", "import aiogram, pydantic"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Запускает скрипт проверки в отдельном процессе
 * @param mode - Режим проверки
 * @returns разобранный JSON результата
 */
async function runCheck(mode: "lazy" | "eager" | "disabled"): Promise<CheckResult> {
  const env = { ...process.env };
  delete env.AIOGRAM_LAZY_MODELS;
  const { stdout } = await execFileAsync(PYTHON, [CHECK_SCRIPT, mode], { env, timeout: 120_000 });
  return JSON.parse(stdout.trim().split("\n").pop() ?? "{}") as CheckResult;
}

const skip = hasAiogram() ? false : "aiogram не установлен";

describe("lazy_aiogram", { skip }, () => {
  let lazy: CheckResult;
  let eager: CheckResult;
  let disabled: CheckResult;

  before(async () => {
    [lazy, eager, disabled] = await Promise.all([runCheck("lazy"), runCheck("eager"), runCheck("disabled")]);
  });

  it("патч применяется и откладывает сборку моделей aiogram", () => {
    assert.strictEqual(lazy.applied, true);
    assert.ok(lazy.models > 500, `моделей: ${lazy.models}`);
    assert.strictEqual(lazy.incomplete_after_import, lazy.models);
  });

  it("все модели aiogram собираются по требованию без ошибок", () => {
    assert.deepStrictEqual(lazy.build_errors, []);
    assert.strictEqual(lazy.models, eager.models);
  });

  it("апдейты и запросы Bot API совпадают с обычным режимом", () => {
    assert.strictEqual(lazy.button_text, "x");
    assert.strictEqual(eager.button_text, "x");
    assert.deepStrictEqual(lazy.requests, eager.requests);
  });

  it("модели, объявленные после патча (код бота), собираются сразу", () => {
    assert.strictEqual(lazy.own_model_complete, true);
  });

  it("импорт aiogram с патчем заметно легче", () => {
    // RSS читается из /proc — вне Linux замер недоступен
    if (eager.import_mb === 0) return;
    assert.ok(eager.import_mb - lazy.import_mb >= 50, `eager ${eager.import_mb} МБ, lazy ${lazy.import_mb} МБ`);
  });

  it("AIOGRAM_LAZY_MODELS=false отключает патч", () => {
    assert.strictEqual(disabled.applied, false);
    assert.strictEqual(disabled.incomplete_after_import, 0);
    assert.deepStrictEqual(disabled.requests, eager.requests);
  });
});
