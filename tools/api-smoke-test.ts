/**
 * @fileoverview Смоук-тест API: сверка ответов с OpenAPI и проверка авторизации
 * @module tools/api-smoke-test
 */

import fs from "node:fs";
import path from "node:path";

const BASE = process.env.API_BASE ?? "http://localhost:5000";
const OPENAPI_PATH = path.join(process.cwd(), "docs/api/openapi.json");

/** Результат одного запроса */
interface ProbeResult {
  /** Метод HTTP */
  method: string;
  /** Путь запроса */
  url: string;
  /** HTTP-код ответа */
  status: number;
  /** Тело ответа (укороченное) */
  bodyPreview: string;
  /** Ошибка сети, если была */
  error?: string;
}

/** Проблема, обнаруженная при тестировании */
interface ApiIssue {
  /** Категория проблемы */
  kind: string;
  /** Метод и путь */
  endpoint: string;
  /** Описание */
  detail: string;
}

/**
 * Заменяет path-параметры OpenAPI на тестовые значения
 * @param openApiPath - Путь из OpenAPI, например /api/projects/{id}
 * @returns Путь с подставленными id
 */
function substitutePathParams(openApiPath: string): string {
  return openApiPath
    .replace(/\{projectId\}/g, "999999999")
    .replace(/\{id\}/g, "999999999")
    .replace(/\{tokenId\}/g, "999999999")
    .replace(/\{versionId\}/g, "999999999")
    .replace(/\{tableName\}/g, "test_table")
    .replace(/\{botId\}/g, "999999999")
    .replace(/\{folderId\}/g, "999999999")
    .replace(/\{configId\}/g, "999999999")
    .replace(/\{fileId\}/g, "999999999")
    .replace(/\{userId\}/g, "999999999")
    .replace(/\{[^}]+\}/g, "test");
}

/**
 * Выполняет HTTP-запрос
 * @param method - HTTP-метод
 * @param url - Полный URL
 * @param cookie - Cookie сессии
 * @returns Результат пробы
 */
async function probe(
  method: string,
  url: string,
  cookie?: string,
): Promise<ProbeResult> {
  try {
    const headers: Record<string, string> = {};
    if (cookie) headers.Cookie = cookie;

    const res = await fetch(url, {
      method,
      headers,
      redirect: "manual",
    });

    const text = await res.text();
    const preview = text.length > 200 ? `${text.slice(0, 200)}…` : text;

    return { method, url, status: res.status, bodyPreview: preview };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { method, url, status: 0, bodyPreview: "", error: msg };
  }
}

/**
 * Извлекает connect.sid из Set-Cookie заголовков dev-login
 * @param setCookie - Значение Set-Cookie
 * @returns Строка cookie для последующих запросов
 */
function extractSessionCookie(setCookie: string | null): string | undefined {
  if (!setCookie) return undefined;
  const match = setCookie.match(/connect\.sid=[^;]+/);
  return match?.[0];
}

/**
 * Точка входа смоук-теста
 */
async function main(): Promise<void> {
  const spec = JSON.parse(fs.readFileSync(OPENAPI_PATH, "utf8")) as {
    paths: Record<
      string,
      Record<string, { security?: unknown[]; summary?: string }>
    >;
  };

  const issues: ApiIssue[] = [];
  const results: ProbeResult[] = [];

  // 1. Публичные GET без auth
  const publicGets = [
    "/api/health",
    "/api/config",
    "/api",
  ];

  for (const p of publicGets) {
    const r = await probe("GET", `${BASE}${p}`);
    results.push(r);
    if (r.status === 0) {
      issues.push({ kind: "network", endpoint: `GET ${p}`, detail: r.error ?? "нет ответа" });
    } else if (r.status >= 500) {
      issues.push({ kind: "server_error", endpoint: `GET ${p}`, detail: `${r.status}: ${r.bodyPreview}` });
    }
  }

  // 2. Защищённый эндпоинт без auth → ожидаем 401
  const protectedSample = "/api/projects";
  const unauth = await probe("GET", `${BASE}${protectedSample}`);
  results.push(unauth);
  if (unauth.status !== 401) {
    issues.push({
      kind: "auth_bypass",
      endpoint: `GET ${protectedSample}`,
      detail: `Ожидали 401 без сессии, получили ${unauth.status}`,
    });
  }

  // 3. Dev-login
  const loginRes = await fetch(`${BASE}/api/auth/dev-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: 123456789, firstName: "ApiSmokeTest" }),
  });
  const loginBody = await loginRes.text();
  const sessionCookie = extractSessionCookie(loginRes.headers.get("set-cookie"));

  if (loginRes.status !== 200) {
    issues.push({
      kind: "auth_setup",
      endpoint: "POST /api/auth/dev-login",
      detail: `${loginRes.status}: ${loginBody}`,
    });
  } else if (!sessionCookie) {
    issues.push({
      kind: "auth_setup",
      endpoint: "POST /api/auth/dev-login",
      detail: "200 OK, но нет connect.sid в Set-Cookie",
    });
  }

  // 4. С auth — ключевые эндпоинты
  const authedGets = [
    "/api/projects",
    "/api/templates",
    "/api/user",
    "/api/agent-tokens",
    "/api/bots",
    "/api/settings",
  ];

  for (const p of authedGets) {
    const r = await probe("GET", `${BASE}${p}`, sessionCookie);
    results.push(r);
    if (r.status === 401 && sessionCookie) {
      issues.push({ kind: "auth_fail", endpoint: `GET ${p}`, detail: "401 даже с сессией после dev-login" });
    } else if (r.status >= 500) {
      issues.push({ kind: "server_error", endpoint: `GET ${p}`, detail: `${r.status}: ${r.bodyPreview}` });
    } else if (r.status === 404) {
      issues.push({ kind: "not_found", endpoint: `GET ${p}`, detail: r.bodyPreview });
    }
  }

  // 5. Скан всех GET из OpenAPI (только read-only)
  const getPaths: string[] = [];
  for (const [p, methods] of Object.entries(spec.paths)) {
    if (methods.get) getPaths.push(p);
  }

  let scanned = 0;
  const maxScan = 80;
  for (const openApiPath of getPaths) {
    if (scanned >= maxScan) break;
    const urlPath = substitutePathParams(openApiPath);
    if (urlPath.includes("/webhook/")) continue;

    const op = spec.paths[openApiPath]?.get;
    const isPublic = Array.isArray(op?.security) && op.security.length === 0;

    const r = await probe("GET", `${BASE}${urlPath}`, isPublic ? undefined : sessionCookie);
    scanned++;
    results.push(r);

    if (r.status === 0) {
      issues.push({ kind: "network", endpoint: `GET ${urlPath}`, detail: r.error ?? "" });
    } else if (r.status >= 500) {
      issues.push({ kind: "server_error", endpoint: `GET ${urlPath}`, detail: `${r.status}: ${r.bodyPreview}` });
    } else if (!isPublic && r.status === 401 && sessionCookie) {
      issues.push({ kind: "auth_fail", endpoint: `GET ${urlPath}`, detail: "401 с валидной сессией" });
    }
  }

  // 6. OpenAPI vs runtime: security mismatch на /api
  const rootOp = spec.paths["/api"]?.get;
  if (rootOp && Array.isArray(rootOp.security) && rootOp.security.length === 0) {
    const rootAuthed = await probe("GET", `${BASE}/api`, sessionCookie);
    if (rootAuthed.status === 401) {
      issues.push({
        kind: "spec_mismatch",
        endpoint: "GET /api",
        detail: "OpenAPI: security=[], runtime: 401 без auth (или наоборот — проверьте allowlist)",
      });
    }
  }

  // 7. Невалидные методы / malformed bodies
  const badLogin = await fetch(`${BASE}/api/auth/dev-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (badLogin.status !== 400) {
    issues.push({
      kind: "validation",
      endpoint: "POST /api/auth/dev-login (пустое тело)",
      detail: `Ожидали 400, получили ${badLogin.status}`,
    });
  }

  const badProject = await fetch(`${BASE}/api/projects/invalid-id-xyz`, {
    headers: sessionCookie ? { Cookie: sessionCookie } : {},
  });
  if (badProject.status === 500) {
    const t = await badProject.text();
    issues.push({
      kind: "validation",
      endpoint: "GET /api/projects/invalid-id-xyz",
      detail: `500 вместо 400/404: ${t.slice(0, 150)}`,
    });
  }

  // 8. CRUD проекта (happy path)
  if (sessionCookie) {
    const createRes = await fetch(`${BASE}/api/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: sessionCookie },
      body: JSON.stringify({ name: `Smoke ${Date.now()}`, description: "test" }),
    });
    const createText = await createRes.text();
    if (createRes.status !== 201 && createRes.status !== 200) {
      issues.push({
        kind: "crud",
        endpoint: "POST /api/projects",
        detail: `${createRes.status}: ${createText.slice(0, 150)}`,
      });
    } else {
      try {
        const created = JSON.parse(createText) as { id?: number };
        if (created.id) {
          const getRes = await fetch(`${BASE}/api/projects/${created.id}`, {
            headers: { Cookie: sessionCookie },
          });
          if (getRes.status !== 200) {
            issues.push({
              kind: "crud",
              endpoint: `GET /api/projects/${created.id}`,
              detail: `${getRes.status} после успешного create`,
            });
          }
          await fetch(`${BASE}/api/projects/${created.id}`, {
            method: "DELETE",
            headers: { Cookie: sessionCookie },
          });
        }
      } catch {
        issues.push({ kind: "crud", endpoint: "POST /api/projects", detail: "Ответ не JSON" });
      }
    }
  }

  // Отчёт
  console.log("\n=== API Smoke Test ===");
  console.log(`Base: ${BASE}`);
  console.log(`Probed: ${results.length} requests`);
  console.log(`OpenAPI GET paths total: ${getPaths.length}, scanned: ${scanned}`);

  const byKind = new Map<string, ApiIssue[]>();
  for (const i of issues) {
    const list = byKind.get(i.kind) ?? [];
    list.push(i);
    byKind.set(i.kind, list);
  }

  if (issues.length === 0) {
    console.log("\n✅ Критичных проблем не найдено в прогоне.");
  } else {
    console.log(`\n⚠️  Найдено проблем: ${issues.length}\n`);
    for (const [kind, list] of byKind) {
      console.log(`--- ${kind} (${list.length}) ---`);
      for (const i of list) {
        console.log(`  ${i.endpoint}`);
        console.log(`    ${i.detail}`);
      }
    }
  }

  // Статистика кодов
  const statusCounts = new Map<number, number>();
  for (const r of results) {
    statusCounts.set(r.status, (statusCounts.get(r.status) ?? 0) + 1);
  }
  console.log("\n--- Статистика HTTP-кодов ---");
  for (const [code, count] of [...statusCounts.entries()].sort((a, b) => a[0] - b[0])) {
    console.log(`  ${code}: ${count}`);
  }

  process.exit(issues.some((i) => i.kind === "server_error" || i.kind === "auth_bypass") ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
