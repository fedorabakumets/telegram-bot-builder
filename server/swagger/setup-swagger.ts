/**
 * @fileoverview OpenAPI (Swagger) — интерактивная документация HTTP API
 * UI: GET /docs · JSON: GET /docs-json
 * @module server/swagger/setup-swagger
 */

import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import type { Express } from "express";
import swaggerUi from "swagger-ui-express";
import { isPublicApiPath } from "../middleware/requireApiAuth";
import { buildOpenApiTags, collectApiRoutes } from "./collect-routes";
import { documentedRegistry } from "./register-documented-paths";

/** Пути Swagger UI / OpenAPI JSON — вне префикса /api, без session auth */
export const SWAGGER_PATHS = ["/docs", "/docs-json"] as const;

/** OpenAPI 3 document (минимальная типизация для сборки spec) */
interface OpenApiDocument {
  openapi: string;
  info: { title: string; description: string; version: string };
  tags: Array<{ name: string; description: string }>;
  paths: Record<string, Record<string, unknown>>;
  components: {
    securitySchemes: Record<string, unknown>;
    schemas?: Record<string, unknown>;
  };
  security: Array<Record<string, string[]>>;
}

/**
 * Преобразует полный путь /api/... в req.path для allowlist публичных роутов.
 * @param fullPath - Путь вида /api/health
 * @returns Путь без префикса /api
 */
function toApiRelativePath(fullPath: string): string {
  if (fullPath === "/api") return "/";
  if (fullPath.startsWith("/api/")) return fullPath.slice(4);
  return fullPath;
}

/**
 * Сливает paths и components из детальной документации в базовый spec.
 * @param base - Базовый document из auto-collect
 * @param documented - Fragment из Zod registry
 * @returns Объединённый document
 */
function mergeDocumentedPaths(base: OpenApiDocument, documented: OpenApiDocument): OpenApiDocument {
  const mergedPaths = { ...base.paths };

  for (const [path, methods] of Object.entries(documented.paths ?? {})) {
    mergedPaths[path] = { ...(mergedPaths[path] ?? {}), ...methods };
  }

  return {
    ...base,
    paths: mergedPaths,
    components: {
      ...base.components,
      ...documented.components,
      securitySchemes: {
        ...base.components.securitySchemes,
        ...documented.components?.securitySchemes,
      },
      schemas: {
        ...(base.components.schemas ?? {}),
        ...(documented.components?.schemas ?? {}),
      },
    },
  };
}

/**
 * Строит OpenAPI document из Express-маршрутов + эталонные Zod-схемы.
 * @param app - Экземпляр Express после registerRoutes
 * @returns OpenAPI 3.0 spec
 */
function buildOpenApiDocument(app: Express): OpenApiDocument {
  const routes = collectApiRoutes(app);
  const paths: OpenApiDocument["paths"] = {};

  for (const route of routes) {
    paths[route.path] ??= {};
    const isPublic = isPublicApiPath(toApiRelativePath(route.path));

    paths[route.path][route.method.toLowerCase()] = {
      tags: [route.tag],
      summary: `${route.method} ${route.path}`,
      ...(isPublic ? { security: [] } : {}),
      responses: {
        "200": { description: "Успешный ответ" },
        "401": { description: "Требуется авторизация (сессия или Bearer PAT)" },
        "503": { description: "Приложение не настроено (/setup)" },
      },
    };
  }

  const base: OpenApiDocument = {
    openapi: "3.0.3",
    info: {
      title: "Telegram Bot Builder API",
      description:
        "REST API визуального конструктора Telegram-ботов. " +
        "Авторизация: сессионная cookie после POST /api/auth/telegram или " +
        "Authorization: Bearer <agent-token> для MCP/CLI. " +
        "Эталонные эндпоинты (health, auth, projects) содержат полные схемы request/response.",
      version: "2.2.0",
    },
    tags: buildOpenApiTags(routes),
    paths,
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "connect.sid",
          description: "Сессия после входа через Telegram Login Widget",
        },
        agentToken: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "PAT",
          description: "Персональный токен агента (MCP/CLI)",
        },
      },
    },
    security: [{ cookieAuth: [] }, { agentToken: [] }],
  };

  const generator = new OpenApiGeneratorV3(documentedRegistry.definitions);
  const documented = generator.generateDocument({
    openapi: "3.0.3",
    info: base.info,
  }) as OpenApiDocument;

  return mergeDocumentedPaths(base, documented);
}

/**
 * Подключить Swagger UI и JSON spec к Express-приложению.
 * @param app - Экземпляр Express
 * @returns void
 */
export function setupSwagger(app: Express): void {
  const document = buildOpenApiDocument(app);

  app.get("/docs-json", (_req, res) => {
    res.json(document);
  });

  app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(document, {
      customSiteTitle: "Telegram Bot Builder API",
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: "alpha",
        operationsSorter: "alpha",
        url: "/docs-json",
      },
    }),
  );
}
