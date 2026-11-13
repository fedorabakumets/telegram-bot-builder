/** @fileoverview Проверяет явный выбор общего Python-хоста без изменения прежних настроек. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadRunnerConfig } from "./runnerConfig";

test("раздельный Python остаётся значением по умолчанию и допускает прежние пути", () => {
  for (const value of [undefined, "", "   ", "split", " split "]) {
    const config = loadRunnerConfig({ REDIS_URL: "redis://unused", RUNNER_PYTHON_HOST: value });
    assert.equal(config.pythonHost, "split");
    assert.equal(config.processPolling, "python");
    assert.equal(config.processHandler, "shared");
  }
  assert.equal(loadRunnerConfig({ REDIS_URL: "redis://unused", RUNNER_PROCESS_HANDLER: "isolated" }).pythonHost, "split");
});

test("единый Python включается явно для Node и общего обработчика", () => {
  const config = loadRunnerConfig({ REDIS_URL: "redis://unused", RUNNER_PROCESS_POLLING: "node", RUNNER_PYTHON_HOST: " unified " });
  assert.equal(config.pythonHost, "unified");
  assert.equal(config.processHandler, "shared");
});

test("ошибочная топология и несовместимые комбинации отклоняются при запуске", () => {
  for (const value of ["other", "UNIFIED", "isolated"]) {
    assert.throws(() => loadRunnerConfig({ REDIS_URL: "redis://unused", RUNNER_PYTHON_HOST: value }), /RUNNER_PYTHON_HOST/);
  }
  for (const [polling, handler] of [["python", "shared"], ["node", "isolated"], ["python", "isolated"]]) {
    assert.throws(() => loadRunnerConfig({ REDIS_URL: "redis://unused", RUNNER_PROCESS_POLLING: polling,
      RUNNER_PROCESS_HANDLER: handler, RUNNER_PYTHON_HOST: "unified" }), /unified требует/);
  }
});
