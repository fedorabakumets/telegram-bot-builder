/** @fileoverview Проверки срока ожидания Windows, локального Linux, Docker и исполнителя. */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { workerReadyTimeout } from "./workerReadyTimeout";

describe("workerReadyTimeout", () => {
  it("даёт локальному Windows 60 секунд для холодного импорта Python", () => {
    assert.equal(workerReadyTimeout({ docker: false, remote: false }, "win32"), 60_000);
    assert.equal(workerReadyTimeout(undefined, "win32"), 60_000);
  });

  it("сохраняет 10 секунд для обычного локального Linux и macOS", () => {
    assert.equal(workerReadyTimeout({ docker: false, remote: false }, "linux"), 10_000);
    assert.equal(workerReadyTimeout(undefined, "darwin"), 10_000);
  });

  it("даёт контейнеру 60 секунд независимо от платформы", () => {
    assert.equal(workerReadyTimeout({ docker: true }, "linux"), 60_000);
    assert.equal(workerReadyTimeout({ docker: true }, "win32"), 60_000);
  });

  it("даёт удалённому исполнителю 60 секунд независимо от платформы", () => {
    assert.equal(workerReadyTimeout({ remote: true }, "linux"), 60_000);
    assert.equal(workerReadyTimeout({ remote: true }, "darwin"), 60_000);
  });
});
