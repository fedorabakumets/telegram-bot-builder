/**
 * @fileoverview Внешний роутер SPA и образ отдают разделы рантайма и снимки BotFather
 * @module server/admin/admin-runtime-route.test
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { RUNTIME_GUIDES } from "./runtime-guides";
import { serveRuntimeGuideEmbed } from "./pages/guide-docs-page";
import type { Request, Response } from "express";

/** Корень репозитория */
const root = path.resolve(import.meta.dirname, "..", "..");

/** Id разделов из runtime-groups.ts */
const GROUPS = ["storages", "backups", "workers", "runners", "builds", "platform"];

/** Файлы снимков, на которые ссылается инструкция OIDC */
const SHOTS = [
  "botfather-login-widget.png",
  "botfather-switch-to-oidc.png",
  "botfather-confirm-oidc.png",
  "botfather-redirect-uris.png",
  "botfather-client-id-secret.png",
];

/**
 * Читает файл репозитория как текст
 * @param rel - Путь от корня репозитория
 * @returns Содержимое файла
 */
function readRepo(rel: string): string {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

describe("маршруты админки рантайма", () => {
  it("внешний роутер SPA открывает /admin/runtime/:group", () => {
    const app = readRepo("client/App.tsx");
    assert.match(app, /path="\/admin\/runtime\/:group"/);
  });

  it("серверные страницы совпадают с id групп", () => {
    const pages = readRepo("server/admin/admin-client-pages.ts");
    for (const id of GROUPS) {
      assert.match(pages, new RegExp(`"/admin/runtime/${id}"`));
    }
  });
});

describe("опубликованные инструкции рантайма", () => {
  it("фрейм перенаправляется на соответствующие статьи GitHub Pages", () => {
    for (const guide of RUNTIME_GUIDES) {
      let destination = "";
      const response = { redirect: (status: number, url: string) => {
        assert.equal(status, 302);
        destination = url;
      } } as unknown as Response;
      serveRuntimeGuideEmbed({ params: { slug: guide.slug } } as unknown as Request, response);
      assert.equal(destination, "https://fedorabakumets.github.io/telegram-bot-builder/docs/" + guide.file.replace(/\.md$/, ""));
      assert.ok(fs.existsSync(path.join(root, "docs", guide.file)));
    }
  });

  it("образ не собирает и не копирует документацию", () => {
    const docker = readRepo("Dockerfile");
    assert.doesNotMatch(docker, /^COPY --from=builder \/app\/docs \.\/docs$/m);
    assert.doesNotMatch(docker, /COPY[^\n]*\/app\/docs/);
    assert.doesNotMatch(docker, /RUN npm run docs/);
    const ignored = readRepo(".dockerignore");
    assert.match(ignored, /^docs\/$/m);
    assert.match(ignored, /^docs-site\/$/m);
  });
});

describe("снимки BotFather в образе", () => {
  it("Dockerfile копирует каталог assets", () => {
    const docker = readRepo("Dockerfile");
    assert.match(docker, /^COPY assets \.\/assets$/m);
  });

  it("png лежат в assets/images и указаны в инструкции", () => {
    const steps = readRepo("docs/development/INSTALLATION.md");
    for (const name of SHOTS) {
      const file = path.join(root, "assets/images", name);
      assert.ok(fs.existsSync(file), name);
      assert.ok(fs.statSync(file).size > 1000, name);
      assert.match(steps, new RegExp(`assets/images/${name}`));
    }
  });
});
