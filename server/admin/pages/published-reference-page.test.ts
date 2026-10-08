/**
 * @fileoverview Проверка старых адресов справочников без чтения локальной документации.
 */
import { it } from "node:test";
import assert from "node:assert/strict";
import type { Request, Response } from "express";
import {
  serveSchemaDocsEmbedIndex, serveSchemaDocsEmbedTable,
  serveApiDocsEmbedIndex, serveApiDocsEmbedTag,
} from "./published-reference-page";

it("перенаправляет индексы и статьи на сайт, экранируя параметры пути", () => {
  for (const [handler, params, suffix] of [
    [serveSchemaDocsEmbedIndex, {}, "database"],
    [serveSchemaDocsEmbedTable, { tableName: "agent_tokens" }, "database/agent_tokens"],
    [serveApiDocsEmbedIndex, {}, "api"],
    [serveApiDocsEmbedTag, { slug: "agent-tokens" }, "api/agent-tokens"],
    [serveApiDocsEmbedTag, { slug: "../?x" }, "api/..%2F%3Fx"],
  ] as const) {
    let destination = "";
    const response = { redirect: (status: number, url: string) => {
      assert.equal(status, 302);
      destination = url;
    } } as unknown as Response;
    handler({ params } as unknown as Request, response);
    assert.equal(destination, `https://fedorabakumets.github.io/telegram-bot-builder/docs/${suffix}`);
  }
});
