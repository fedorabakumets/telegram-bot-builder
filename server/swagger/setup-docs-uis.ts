/**
 * @fileoverview Подключение OpenAPI UI (Swagger, Scalar, Redoc, RapiDoc)
 * @module server/swagger/setup-docs-uis
 */

import { apiReference } from "@scalar/express-api-reference";
import type { Express, RequestHandler } from "express";
import { redocExpressMiddleware } from "redoc-express-maintained";
import swaggerUi from "swagger-ui-express";
import { createDocsHubHandler } from "./docs-hub";
import { createRapidocHandler } from "./rapidoc-page";

/** Опции монтирования документации */
export interface DocsMountOptions {
  /** Префикс UI, например /docs или /admin/docs */
  basePath?: string;
  /** Путь JSON spec */
  specPath?: string;
  /** Middleware защиты (admin auth) */
  protect?: RequestHandler;
}

/** OpenAPI document для монтирования UI */
type OpenApiDocument = Record<string, unknown>;

/**
 * Подключить hub и UI документации к Express.
 * @param app - Экземпляр Express
 * @param document - OpenAPI spec
 * @param options - basePath, specPath, protect
 * @returns void
 */
export function setupDocsUis(app: Express, document: OpenApiDocument, options: DocsMountOptions = {}): void {
  const basePath = options.basePath ?? "/docs";
  const specPath = options.specPath ?? "/docs-json";
  const protect = options.protect;

  if (protect) {
    app.use(basePath, protect);
    app.get(specPath, protect, (_req, res) => {
      res.json(document);
    });
  } else {
    app.get(specPath, (_req, res) => {
      res.json(document);
    });
  }

  app.get(basePath, createDocsHubHandler(basePath, specPath));

  app.use(
    `${basePath}/swagger`,
    swaggerUi.serve,
    swaggerUi.setup(document, {
      customSiteTitle: "Telegram Bot Builder API — Swagger",
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: "alpha",
        operationsSorter: "alpha",
        url: specPath,
      },
    }),
  );

  app.use(
    `${basePath}/scalar`,
    apiReference({
      url: specPath,
      pageTitle: "Telegram Bot Builder API — Scalar",
      title: "Telegram Bot Builder API",
      theme: "purple",
      layout: "modern",
      hideDownloadButton: false,
      persistAuth: true,
    }),
  );

  app.get(
    `${basePath}/redoc`,
    redocExpressMiddleware({
      title: "Telegram Bot Builder API — Redoc",
      specUrl: specPath,
      redocOptions: {
        scrollYOffset: 0,
        hideDownloadButton: false,
        theme: { colors: { primary: { main: "#58a6ff" } } },
      },
    }),
  );

  app.get(`${basePath}/rapidoc`, createRapidocHandler(specPath));
}

/** Пути публичной документации (dev) */
export const PUBLIC_DOCS_PATHS = ["/docs", "/docs-json", "/docs/swagger", "/docs/scalar", "/docs/redoc", "/docs/rapidoc"] as const;

/** Пути admin-документации */
export const ADMIN_DOCS_PATHS = [
  "/admin/docs",
  "/admin/openapi.json",
  "/admin/docs/swagger",
  "/admin/docs/scalar",
  "/admin/docs/redoc",
  "/admin/docs/rapidoc",
] as const;

/** Все пути документации */
export const DOCS_PATHS = [...PUBLIC_DOCS_PATHS, ...ADMIN_DOCS_PATHS] as const;

/** @deprecated Используйте DOCS_PATHS */
export const SWAGGER_PATHS = DOCS_PATHS;
