/**
 * @fileoverview Пустой секрет не стирает значение, пустое обычное поле удаляет ключ
 * @module server/admin/runtime-save-rules.test
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { decideRuntimeSave } from "./runtime-save-rules";

describe("decideRuntimeSave", () => {
  it("пустой и пропущенный секрет не пишет", () => {
    assert.deepStrictEqual(decideRuntimeSave("secret", ""), { action: "skip" });
    assert.deepStrictEqual(decideRuntimeSave("secret", "  "), { action: "skip" });
    assert.deepStrictEqual(decideRuntimeSave("secret", undefined), { action: "skip" });
    assert.deepStrictEqual(decideRuntimeSave("secret", " tok "), { action: "set", value: "tok" });
  });

  it("явная пустая строка обычного поля удаляет ключ", () => {
    assert.deepStrictEqual(decideRuntimeSave("text", ""), { action: "delete" });
    assert.deepStrictEqual(decideRuntimeSave("number", "  "), { action: "delete" });
    assert.deepStrictEqual(decideRuntimeSave("text", undefined), { action: "skip" });
    assert.deepStrictEqual(decideRuntimeSave("storage", "s3-private"), { action: "set", value: "s3-private" });
  });

  it("булево false записывается, пустая строка удаляет ключ", () => {
    assert.deepStrictEqual(decideRuntimeSave("bool", false), { action: "set", value: "false" });
    assert.deepStrictEqual(decideRuntimeSave("bool", true), { action: "set", value: "true" });
    assert.deepStrictEqual(decideRuntimeSave("bool", ""), { action: "delete" });
    assert.deepStrictEqual(decideRuntimeSave("bool", undefined), { action: "skip" });
  });
});
