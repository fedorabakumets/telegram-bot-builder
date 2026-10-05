/**
 * @fileoverview Оверлей админки не мешает живому env и чужому объекту в тестах
 * @module server/services/runtime-overlay.test
 */

import { afterEach, describe, it } from "node:test";
import assert from "node:assert";
import { runtimeEnv, runtimeFlag, setRuntimeOverlay } from "./runtime-overlay";

/** Имя, которого нет в обычном окружении тестов */
const NAME = "RUNTIME_OVERLAY_TEST_FLAG";

describe("runtime overlay", () => {
  const previous = process.env[NAME];
  afterEach(() => {
    setRuntimeOverlay({});
    if (previous === undefined) delete process.env[NAME];
    else process.env[NAME] = previous;
  });

  it("пустой оверлей читает process.env", () => {
    process.env[NAME] = "from-env";
    setRuntimeOverlay({});
    assert.strictEqual(runtimeEnv(NAME), "from-env");
  });

  it("непустой оверлей побеждает process.env", () => {
    process.env[NAME] = "from-env";
    setRuntimeOverlay({ [NAME]: "from-admin" });
    assert.strictEqual(runtimeEnv(NAME), "from-admin");
  });

  it("чужой объект env оверлей не видит", () => {
    setRuntimeOverlay({ [NAME]: "from-admin" });
    assert.strictEqual(runtimeEnv(NAME, { [NAME]: "custom" }), "custom");
    assert.strictEqual(runtimeEnv(NAME, {}), undefined);
  });

  it("runtimeFlag принимает true, 1 и yes без учёта регистра", () => {
    for (const value of ["true", "TRUE", "1", "yes", " YES "]) {
      setRuntimeOverlay({ [NAME]: value });
      assert.strictEqual(runtimeFlag(NAME), true, value);
    }
    setRuntimeOverlay({ [NAME]: "false" });
    assert.strictEqual(runtimeFlag(NAME), false);
    assert.strictEqual(runtimeFlag(NAME, { [NAME]: "1" }), true);
  });
});
