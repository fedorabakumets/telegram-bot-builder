/** @fileoverview Проверка адреса webhook до запуска сценария исполнителем. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { runnerWebhookProject } from "./runnerWebhookProject";

test("polling и служебные команды не регистрируют webhook", () => {
  assert.equal(runnerWebhookProject({ cmd: "start_bot", token_id: 58 }), undefined);
  assert.equal(runnerWebhookProject({ cmd: "stop_bot", token_id: 58, webhook_url: "bad" }), undefined);
});

test("корректный адрес возвращает проект", () => {
  assert.equal(runnerWebhookProject({ cmd: "start_bot", token_id: 58, webhook_url: "https://api.example/api/webhook/12/58" }), 12);
});

test("некорректный адрес и чужой токен отклоняются до запуска", () => {
  for (const address of ["bad", "http://api.example/api/webhook/12/58", "https://api.example/api/webhook/12/59",
    "https://api.example/api/webhook/9007199254740992/58", "https://user:password@api.example/api/webhook/12/58"]) {
    assert.throws(() => runnerWebhookProject({ cmd: "start_bot", token_id: 58, webhook_url: address }), /webhook/);
  }
});
