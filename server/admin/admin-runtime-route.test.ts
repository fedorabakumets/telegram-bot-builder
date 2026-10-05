/**
 * @fileoverview Внешний роутер SPA и образ отдают разделы рантайма и снимки BotFather
 * @module server/admin/admin-runtime-route.test
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

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

describe("снимки BotFather в образе", () => {
  it("Dockerfile копирует каталог assets", () => {
    const docker = readRepo("Dockerfile");
    assert.match(docker, /^COPY assets \.\/assets$/m);
  });

  it("png лежат в assets/images и указаны в инструкции", () => {
    const steps = readRepo("client/components/admin/settings/botfather-steps.tsx");
    for (const name of SHOTS) {
      const file = path.join(root, "assets/images", name);
      assert.ok(fs.existsSync(file), name);
      assert.ok(fs.statSync(file).size > 1000, name);
      assert.match(steps, new RegExp(`/assets/images/${name}`));
    }
  });
});
