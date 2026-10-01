/**
 * @fileoverview Тесты подстановки региона и образа исполнителя в шаблон площадки
 * @module server/sites/railway/siteTemplateConfig.test
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { prepareSiteTemplateConfig, type SiteTemplateConfig } from "./siteTemplateConfig";

/** Конфигурация шаблона из трёх сервисов */
const CONFIG: SiteTemplateConfig = {
  buckets: {},
  services: {
    a: { name: "Runner", source: { image: "runner:latest" }, deploy: { restartPolicyType: "ON_FAILURE" } },
    b: { name: "Redis", source: { image: "redis:8.2" }, volumeMounts: { b: { mountPath: "/data" } } },
    c: { name: "Postgres", source: { image: "postgres-ssl:18" } },
  },
};

describe("prepareSiteTemplateConfig", () => {
  it("ставит регион всем сервисам и сохраняет остальные поля", () => {
    const next = prepareSiteTemplateConfig(CONFIG, { region: "europe-west4-drams3a" });
    for (const service of Object.values(next.services)) {
      assert.strictEqual(service.deploy?.region, "europe-west4-drams3a");
      assert.deepStrictEqual(service.deploy?.multiRegionConfig, { "europe-west4-drams3a": { numReplicas: 1 } });
    }
    assert.strictEqual(next.services.a.deploy?.restartPolicyType, "ON_FAILURE");
    assert.deepStrictEqual(next.services.b.volumeMounts, { b: { mountPath: "/data" } });
    assert.deepStrictEqual(next.buckets, {});
  });

  it("меняет образ только исполнителю и не трогает исходную конфигурацию", () => {
    const next = prepareSiteTemplateConfig(CONFIG, { region: "r", runnerImage: "runner:branch" });
    assert.strictEqual(next.services.a.source?.image, "runner:branch");
    assert.strictEqual(next.services.b.source?.image, "redis:8.2");
    assert.strictEqual(CONFIG.services.a.source?.image, "runner:latest");
    assert.strictEqual(CONFIG.services.a.deploy?.region, undefined);
  });

  it("отклоняет шаблон без исполнителя", () => {
    assert.throws(() => prepareSiteTemplateConfig({ services: { b: { name: "Redis" } } }, { region: "r" }), /Runner/);
  });
});
