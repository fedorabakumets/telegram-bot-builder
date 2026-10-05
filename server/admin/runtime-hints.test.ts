/**
 * @fileoverview Placeholder раздела storages приходит в поле API и не пишется как значение
 * @module server/admin/runtime-hints.test
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { runtimeFormValue } from "../../client/components/admin/runtime/runtime-types";
import { decideRuntimeSave } from "./runtime-save-rules";
import { toRuntimeFieldView } from "./runtime-field-view";
import { findRuntimeGroup, RUNTIME_GROUPS } from "./runtime-groups";
import { findRuntimeGuide, RUNTIME_GUIDES } from "./runtime-guides";

/** Корень репозитория */
const root = path.resolve(import.meta.dirname, "..", "..");

/** Поля, у которых нет строки примера */
const WITHOUT_PLACEHOLDER = new Set(["bool", "storage"]);

describe("примеры полей рантайма", () => {
  it("у storages placeholder есть в ответе поля и не попадает в значение", () => {
    const group = findRuntimeGroup("storages");
    assert.ok(group);
    const fields = group.fields.map(toRuntimeFieldView);
    const backend = fields.find((field) => field.env === "STORAGE_BACKEND");
    const limit = fields.find((field) => field.env === "STORAGE_LIMIT_GB");
    const endpoint = fields.find((field) => field.env === "S3_ENDPOINT_URL");
    const region = fields.find((field) => field.env === "S3_REGION");
    const access = fields.find((field) => field.env === "S3_ACCESS_KEY_ID");
    assert.equal(backend?.placeholder, "s3");
    assert.equal(limit?.placeholder, "10");
    assert.equal(endpoint?.placeholder, "https://s3.amazonaws.com");
    assert.equal(region?.placeholder, "us-east-1");
    assert.equal(access?.placeholder, "AKIA...");
    assert.equal(access?.value, "");
    assert.equal(runtimeFormValue(access!), "");
    assert.notEqual(runtimeFormValue(access!), access?.placeholder);
    assert.deepStrictEqual(decideRuntimeSave("secret", access?.value), { action: "skip" });
    assert.deepStrictEqual(decideRuntimeSave("text", ""), { action: "delete" });
    assert.equal(decideRuntimeSave("text", "").value, undefined);
  });

  it("пример есть у текстовых полей всех разделов и нет у списка и флага", () => {
    for (const group of RUNTIME_GROUPS) {
      assert.ok(group.docs && group.docs.length > 0, group.id);
      for (const field of group.fields) {
        const view = toRuntimeFieldView(field);
        if (WITHOUT_PLACEHOLDER.has(field.kind)) {
          assert.equal(view.placeholder, undefined, field.env);
          continue;
        }
        assert.equal(typeof view.placeholder, "string", field.env);
        assert.ok(view.placeholder && view.placeholder.length > 0, field.env);
        const empty = decideRuntimeSave(field.kind, "");
        assert.notEqual(empty.value, view.placeholder);
        if (field.kind === "secret") {
          assert.equal(view.value, "");
          assert.equal(empty.action, "skip");
        } else {
          assert.equal(empty.action, "delete");
        }
      }
    }
  });

  it("ссылки ведут на существующие файлы просмотрщика", () => {
    const pages = fs.readFileSync(path.join(root, "client/App.tsx"), "utf8");
    assert.match(pages, /path="\/admin\/guides\/:slug"/);
    for (const guide of RUNTIME_GUIDES) {
      const full = path.join(root, "docs", guide.file);
      assert.ok(fs.existsSync(full), guide.file);
      assert.equal(findRuntimeGuide(guide.slug)?.file, guide.file);
    }
    const storages = findRuntimeGroup("storages");
    assert.equal(storages?.docs?.[0]?.href, "/admin/guides/uploads-s3");
    const view = fs.readFileSync(path.join(root, "server/admin/runtime-settings-view.ts"), "utf8");
    assert.match(view, /docs: group\.docs/);
    assert.match(view, /toRuntimeFieldView/);
  });
});
