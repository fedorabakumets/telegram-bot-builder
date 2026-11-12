/** @fileoverview Проверки выбора Python без запуска процессов и чтения секретов. */
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { test } from "node:test";
import { testPython } from "./testPython";

test("явная команда CI остаётся командой PATH и имеет приоритет", () => {
  assert.equal(testPython({ RUNNER_PYTHON: "python", PYTHON: "other" }, "linux", () => true), "python");
  assert.equal(testPython({ PYTHON: "/opt/python/bin/python" }, "linux", () => false), "/opt/python/bin/python");
});

test("локальная среда выбирается только при наличии файла", () => {
  assert.equal(testPython({}, "win32", () => true), resolve(".venv/Scripts/python.exe"));
  assert.equal(testPython({}, "linux", () => true), resolve(".venv/bin/python"));
  assert.equal(testPython({}, "linux", () => false), "python");
  assert.equal(testPython({ RUNNER_PYTHON: "  " }, "win32", () => false), "python");
});
