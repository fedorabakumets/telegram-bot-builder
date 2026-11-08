/** @fileoverview Проверка защиты исходников серверного бандла от прямых и кодированных запросов. */
import { test } from "node:test";
import assert from "node:assert/strict";
import type { Request, Response } from "express";
import { protectServerBundle } from "./protect-server-bundle";

/** Проверяет блокировку артефактов без запуска приложения или подключения к базе. */
test("закрывает серверный JavaScript и карты исходников при кодировании и обходе пути", () => {
  for (const path of ["/server/index.js", "/server/index.js.map", "/server%2Findex.js",
    "/assets/%2e%2e/server/index.js", "/assets/%2e%2e/server/index.js.map", "/SERVER/index.js",
    "/assets%5c..%5cserver%5cindex.js"]) {
    let status = 0;
    protectServerBundle({ path } as Request,
      { sendStatus: (value: number) => { status = value; } } as Response,
      () => { assert.fail(`Открыт доступ: ${path}`); });
    assert.equal(status, 404, path);
  }
});

/** Проверяет клиентские ресурсы и отклонение некорректного кодирования. */
test("пропускает клиентские файлы и отклоняет повреждённый URL", () => {
  let next = false;
  protectServerBundle({ path: "/assets/client.js" } as Request, {} as Response, () => { next = true; });
  assert.equal(next, true);
  let status = 0;
  protectServerBundle({ path: "/%ZZ" } as Request,
    { sendStatus: (value: number) => { status = value; } } as Response, () => assert.fail());
  assert.equal(status, 400);
});
